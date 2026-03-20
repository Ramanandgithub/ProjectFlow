<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreProjectRequest;
use App\Http\Requests\RejectProjectRequest;
use App\Http\Resources\ProjectResource;
use App\Jobs\SendProjectNotification;
use App\Models\AuditLog;
use App\Models\Project;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class ProjectController extends Controller
{
    use AuthorizesRequests;
    
    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Project::with(['user', 'latestApproval.admin']);

        // Role-based filtering
        if ($user->isUser()) {
            $query->where('user_id', $user->id);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter by submitter 
        if ($user->isAdmin() && $request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Search by title
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        // Sort
        $sortBy    = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $allowedSorts = ['created_at', 'updated_at', 'title', 'status'];

        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortOrder === 'asc' ? 'asc' : 'desc');
        }

        $projects = $query->paginate($request->get('per_page', 10));

        return response()->json([
            'success' => true,
            'data'    => ProjectResource::collection($projects),
            'meta'    => [
                'current_page' => $projects->currentPage(),
                'last_page'    => $projects->lastPage(),
                'per_page'     => $projects->perPage(),
                'total'        => $projects->total(),
            ],
        ]);
    }

    public function showAuditLogs(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = AuditLog::with(['user', 'project']);

        if ($user->isUser()) {
            $query->whereHas('project', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('project_id')) {
            $query->where('project_id', $request->project_id);
        }

        if ($request->filled('action') && in_array($request->action, ['submitted', 'approved', 'rejected'])) {
            $query->where('action', $request->action);
        }

        $auditLogs = $query->latest('performed_at')->get();

        return response()->json([
            'success' => true,
            'data'    => $auditLogs->map(fn($log) => [
                'id'           => $log->id,
                'action'       => $log->action,
                'note'         => $log->notes,
                'performed_at' => $log->performed_at->toIso8601String(),
                'ip_address'   => $log->ip_address,
                'user'         => [
                    'id'   => $log->user->id,
                    'name' => $log->user->name,
                ],
                'project'      => $log->project ? [
                    'id'    => $log->project->id,
                    'title' => $log->project->title,
                    'submitter' => $log->project->user?->name,
                ] : null,
            ]),
        ]);
    }

    
    public function store(StoreProjectRequest $request): JsonResponse
    {
        $user      = $request->user();
        $filePaths = [];

        // Handle file uploads
        if ($request->hasFile('files')) {
            foreach ($request->file('files') as $file) {
                $path        = $file->store("projects/{$user->id}", 'public');
                $filePaths[] = [
                    'path'          => $path,
                    'original_name' => $file->getClientOriginalName(),
                    'size'          => $file->getSize(),
                    'mime_type'     => $file->getMimeType(),
                ];
            }
        }

        $project = Project::create([
            'title'        => $request->title,
            'description'  => $request->description,
            'user_id'      => $user->id,
            'status'       => 'pending',
            'files'        => $filePaths ?: null,
            'submitted_at' => now(),
        ]);

        // Log the submission
        AuditLog::record($user->id, $project->id, 'submitted', 'Project submitted by user.', $request->ip());

        // Dispatch queued email notification
        SendProjectNotification::dispatch($project, 'submitted');

        return response()->json([
            'success' => true,
            'message' => 'Project submitted successfully.',
            'data'    => new ProjectResource($project->load(['user', 'latestApproval'])),
        ], 201);
    }

    
    public function show(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        // Users can only view their own projects
        if ($user->isUser() && $project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        $project->load(['user', 'approvals.admin', 'auditLogs.user']);

        return response()->json([
            'success' => true,
            'data'    => new ProjectResource($project),
        ]);
    }

    public function approve(Request $request, Project $project): JsonResponse
    {
        $this->authorize('approve', $project);

        if (! $project->isPending()) {
            return response()->json([
                'success' => false,
                'message' => "Project is already {$project->status}.",
            ], 422);
        }

        $admin  = $request->user();
        $reason = $request->input('reason', 'Approved by administrator.');

        // Call the stored procedure
        $result = DB::select('CALL sp_approve_project(?, ?, ?)', [
            $project->id,
            $admin->id,
            $reason,
        ]);

        if (empty($result) || ! $result[0]->success) {
            return response()->json([
                'success' => false,
                'message' => $result[0]->message ?? 'Approval failed.',
            ], 500);
        }

        $project->refresh()->load(['user', 'latestApproval.admin']);

        // Dispatch queued email notification to project owner
        SendProjectNotification::dispatch($project, 'approved', $reason);

        return response()->json([
            'success' => true,
            'message' => 'Project approved successfully.',
            'data'    => new ProjectResource($project),
        ]);
    }

    
    public function reject(RejectProjectRequest $request, Project $project): JsonResponse
    {
        $this->authorize('approve', $project);

        if (! $project->isPending()) {
            return response()->json([
                'success' => false,
                'message' => "Project is already {$project->status}.",
            ], 422);
        }

        $admin  = $request->user();
        $reason = $request->reason;

        $result = DB::select('CALL sp_reject_project(?, ?, ?)', [
            $project->id,
            $admin->id,
            $reason,
        ]);

        if (empty($result) || ! $result[0]->success) {
            return response()->json([
                'success' => false,
                'message' => $result[0]->message ?? 'Rejection failed.',
            ], 500);
        }

        $project->refresh()->load(['user', 'latestApproval.admin']);

        SendProjectNotification::dispatch($project, 'rejected', $reason);

        return response()->json([
            'success' => true,
            'message' => 'Project rejected successfully.',
            'data'    => new ProjectResource($project),
        ]);
    }

    
    public function bulkAction(Request $request): JsonResponse
    {
        $this->authorize('bulkAction', Project::class);

        $request->validate([
            'action'      => ['required', 'in:approve,reject'],
            'project_ids' => ['required', 'array', 'min:1'],
            'project_ids.*' => ['integer', 'exists:projects,id'],
            'reason'      => ['required_if:action,reject', 'string', 'max:500'],
        ]);

        $admin      = $request->user();
        $action     = $request->action;
        $reason     = $request->input('reason', 'Bulk action by administrator.');
        $projectIds = $request->project_ids;
        $processed  = 0;
        $failed     = 0;

        foreach ($projectIds as $projectId) {
            $project = Project::find($projectId);
            if (! $project || ! $project->isPending()) {
                $failed++;
                continue;
            }

            $procedure = $action === 'approve' ? 'sp_approve_project' : 'sp_reject_project';
            $result = DB::select("CALL {$procedure}(?, ?, ?)", [$projectId, $admin->id, $reason]);

            if (! empty($result) && $result[0]->success) {
                $project->refresh();
                SendProjectNotification::dispatch($project, $action, $reason);
                $processed++;
            } else {
                $failed++;
            }
        }

        return response()->json([
            'success' => true,
            'message' => "Bulk action completed. Processed: {$processed}, Failed: {$failed}.",
            'data'    => ['processed' => $processed, 'failed' => $failed],
        ]);
    }

    
    public function stats(Request $request): JsonResponse
    {
        $user  = $request->user();
        $query = Project::query();

        if ($user->isUser()) {
            $query->where('user_id', $user->id);
        }

        $total    = (clone $query)->count();
        $pending  = (clone $query)->where('status', 'pending')->count();
        $approved = (clone $query)->where('status', 'approved')->count();
        $rejected = (clone $query)->where('status', 'rejected')->count();

        $pct = fn($count) => $total > 0 ? round(($count / $total) * 100, 1) : 0;

        return response()->json([
            'success' => true,
            'data'    => [
                'total'    => ['count' => $total,    'percent' => 100],
                'pending'  => ['count' => $pending,  'percent' => $pct($pending)],
                'approved' => ['count' => $approved, 'percent' => $pct($approved)],
                'rejected' => ['count' => $rejected, 'percent' => $pct($rejected)],
            ],
        ]);
    }

    
    public function destroy(Request $request, Project $project): JsonResponse
    {
        $user = $request->user();

        if ($user->isUser() && $project->user_id !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Unauthorized.'], 403);
        }

        if (! $project->isPending()) {
            return response()->json([
                'success' => false,
                'message' => 'Only pending projects can be deleted.',
            ], 422);
        }

        // Delete associated files from storage
        if ($project->files) {
            foreach ($project->files as $file) {
                Storage::disk('public')->delete($file['path']);
            }
        }

        $project->delete();

        return response()->json(['success' => true, 'message' => 'Project deleted successfully.']);
    }
}