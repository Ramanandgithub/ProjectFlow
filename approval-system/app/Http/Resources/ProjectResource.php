<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $latestApproval = $this->whenLoaded('latestApproval');
        $approvals      = $this->whenLoaded('approvals');
        $auditLogs      = $this->whenLoaded('auditLogs');
        
        // Check if relations are actually loaded (not MissingValue)
        $isApprovalsLoaded = !($approvals instanceof \Illuminate\Http\Resources\MissingValue);
        $isAuditLogsLoaded = !($auditLogs instanceof \Illuminate\Http\Resources\MissingValue);

        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'description' => $this->description,
            'status'      => $this->status,
            'files'       => $this->files ?? [],
            'submitted_at' => $this->submitted_at?->toIso8601String(),
            'created_at'  => $this->created_at->toIso8601String(),
            'updated_at'  => $this->updated_at->toIso8601String(),

            // Submitter info
            'user' => $this->whenLoaded('user', fn() => [
                'id'    => $this->user->id,
                'name'  => $this->user->name,
                'email' => $this->user->email,
            ]),

            // Latest approval/rejection details
            'latest_approval' => $latestApproval ? [
                'id'         => $latestApproval->id,
                'decision'   => $latestApproval->decision,
                'reason'     => $latestApproval->reason,
                'decided_at' => $latestApproval->decided_at?->toIso8601String(),
                'admin'      => $latestApproval->relationLoaded('admin') ? [
                    'id'   => $latestApproval->admin->id,
                    'name' => $latestApproval->admin->name,
                ] : null,
            ] : null,

            // Full approval history (when loading single project)
            'approvals' => $this->when(
                $isApprovalsLoaded,
                fn() => $this->approvals->map(fn($a) => [
                    'id'         => $a->id,
                    'decision'   => $a->decision,
                    'reason'     => $a->reason,
                    'decided_at' => $a->decided_at?->toIso8601String(),
                    'admin'      => $a->relationLoaded('admin') ? [
                        'id'   => $a->admin->id,
                        'name' => $a->admin->name,
                    ] : null,
                ])
            ),

            // Audit logs (when loading single project)
            'audit_logs' => $this->when(
                $isAuditLogsLoaded,
                fn() => $this->auditLogs->map(fn($log) => [
                    'id'           => $log->id,
                    'action'       => $log->action,
                    'notes'        => $log->notes,
                    'performed_at' => $log->performed_at?->toIso8601String(),
                    'user'         => $log->relationLoaded('user') ? [
                        'id'   => $log->user->id,
                        'name' => $log->user->name,
                    ] : null,
                ])
            ),
        ];
    }
}