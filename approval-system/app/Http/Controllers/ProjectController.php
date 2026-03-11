<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\AuditLog;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Jobs\SendProjectNotification;
use App\Policies\ProjectPolicy;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    /**
     * GET /api/projects
     * Admins see all; regular users see their own.
     */
    public function index(Request $request)
    {
        $user  = $request->user();
        $query = Project::with('user')->latest();

        if ($user->role !== 'admin') {
            $query->where('user_id', $user->id);
        }

        // Filters
        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }
        if ($search = $request->query('search')) {
            $query->where('title', 'like', "%{$search}%");
        }
        if ($submitter = $request->query('submitter')) {
            $query->whereHas('user', fn($q) => $q->where('name', $submitter));
        }

        // Sorting
        $sort = $request->query('sort', 'created_at');
        $dir  = $request->query('dir', 'desc');
        $allowed = ['title', 'status', 'created_at', 'updated_at'];
        if (in_array($sort, $allowed)) {
            $query->orderBy($sort, $dir === 'asc' ? 'asc' : 'desc');
        }

        return ProjectResource::collection($query->paginate(20));
    }

    /**
     * POST /api/projects
     * Submit a new project.
     */
    public function store(StoreProjectRequest $request)
    {
        $user = $request->user();

        // Handle file uploads
        $files = [];
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path    = $file->store("projects/{$user->id}", 'public');
                $files[] = [
                    'name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime' => $file->getMimeType(),
                ];
            }
        }

        $project = Project::create([
            'user_id'     => $user->id,
            'title'       => $request->title,
            'description' => $request->description,
            'status'      => 'submitted',
            'files'       => $files,
        ]);

        // Log the action
        AuditLog::create([
            'user_id'    => $user->id,
            'project_id' => $project->id,
            'action'     => 'submitted',
            'note'       => '',
        ]);

        // Queue submission confirmation email
        SendProjectNotification::dispatch($project, $user, 'submitted');

        return new ProjectResource($project->load('user'));
    }

    /**
     * GET /api/projects/{id}
     */
    public function show(Request $request, $id)
    {
        $project = Project::with(['user', 'approvals.admin', 'auditLogs.user'])->findOrFail($id);

        // Users can only view their own projects
        if ($request->user()->role !== 'admin' && $project->user_id !== $request->user()->id) {
            abort(403, 'Unauthorized.');
        }

        return new ProjectResource($project);
    }

    /**
     * PATCH /api/projects/{id}/approve
     * Admin approves a project using stored procedure.
     */
    public function approve(Request $request, $id)
    {
        $this->authorize('approve', Project::findOrFail($id));

        // ─── Invoke stored procedure ───────────────────────────────────────
        $result = DB::select("CALL sp_approve_project(?)", [$id]);
        // ──────────────────────────────────────────────────────────────────

        if (isset($result[0]->status) && $result[0]->status === 'error') {
            return response()->json(['message' => $result[0]->message ?? 'Approval failed.'], 422);
        }

        $project = Project::with('user')->findOrFail($id);

        // Send queued approval email to submitter
        SendProjectNotification::dispatch($project, $project->user, 'approved');

        return response()->json([
            'message' => 'Project approved successfully.',
            'project' => new ProjectResource($project),
        ]);
    }

    /**
     * PATCH /api/projects/{id}/reject
     * Admin rejects a project.
     */
    public function reject(Request $request, $id)
    {
        $project = Project::with('user')->findOrFail($id);
        $this->authorize('approve', $project);

        $request->validate([
            'reason' => 'required|string|min:5|max:1000',
        ]);

        DB::transaction(function () use ($request, $project, $id) {
            $project->update([
                'status'           => 'rejected',
                'rejection_reason' => $request->reason,
            ]);

            AuditLog::create([
                'user_id'    => $request->user()->id,
                'project_id' => $id,
                'action'     => 'rejected',
                'note'       => $request->reason,
            ]);
        });

        // Queue rejection email
        SendProjectNotification::dispatch($project, $project->user, 'rejected', $request->reason);

        return response()->json([
            'message' => 'Project rejected.',
            'project' => new ProjectResource($project->fresh()),
        ]);
    }

    /**
     * POST /api/projects/bulk-approve
     */
    public function bulkApprove(Request $request)
    {
        $request->validate(['ids' => 'required|array|min:1', 'ids.*' => 'integer|exists:projects,id']);

        $approved = 0;
        foreach ($request->ids as $id) {
            $result = DB::select("CALL sp_approve_project(?)", [$id]);
            if (!isset($result[0]->status) || $result[0]->status !== 'error') {
                $project = Project::with('user')->find($id);
                if ($project) {
                    SendProjectNotification::dispatch($project, $project->user, 'approved');
                    $approved++;
                }
            }
        }

        return response()->json(['message' => "{$approved} projects approved."]);
    }

    /**
     * POST /api/projects/bulk-reject
     */
    public function bulkReject(Request $request)
    {
        $request->validate([
            'ids'    => 'required|array|min:1',
            'ids.*'  => 'integer|exists:projects,id',
            'reason' => 'required|string|min:5',
        ]);

        Project::whereIn('id', $request->ids)
               ->whereIn('status', ['submitted', 'pending'])
               ->update(['status' => 'rejected', 'rejection_reason' => $request->reason]);

        foreach ($request->ids as $id) {
            AuditLog::create([
                'user_id'    => $request->user()->id,
                'project_id' => $id,
                'action'     => 'rejected',
                'note'       => $request->reason,
            ]);
        }

        return response()->json(['message' => count($request->ids) . ' projects rejected.']);
    }

    /**
     * GET /api/audit-logs
     */
    public function auditLogs()
    {
        $logs = AuditLog::with(['user', 'project'])
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($logs);
    }
}