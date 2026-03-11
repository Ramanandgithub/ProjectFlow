<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'project_id',
        'action',
        'notes',
        'ip_address',
        'performed_at',
    ];

    protected $casts = [
        'performed_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    // ─── Static helper ────────────────────────────────────────────────

    public static function record(int $userId, int $projectId, string $action, ?string $notes = null, ?string $ip = null): self
    {
        return self::create([
            'user_id'      => $userId,
            'project_id'   => $projectId,
            'action'       => $action,
            'notes'        => $notes,
            'ip_address'   => $ip,
            'performed_at' => now(),
        ]);
    }
}