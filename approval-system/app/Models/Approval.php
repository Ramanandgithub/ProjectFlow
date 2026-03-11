<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'project_id',
        'admin_id',
        'decision',
        'reason',
        'decided_at',
    ];

    protected $casts = [
        'decided_at' => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────

    public function project()
    {
        return $this->belongsTo(Project::class);
    }

    public function admin()
    {
        return $this->belongsTo(User::class, 'admin_id');
    }
}