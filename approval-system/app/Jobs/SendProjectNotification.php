<?php

namespace App\Jobs;

use App\Models\Project;
use App\Notifications\ProjectStatusNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class SendProjectNotification implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 60; // seconds between retries

    public function __construct(
        public readonly Project $project,
        public readonly string  $event,   // 'submitted' | 'approved' | 'rejected'
        public readonly ?string $reason = null,
    ) {}

    public function handle(): void
    {
        $project = $this->project->load('user');
        $user    = $project->user;

        if (! $user) {
            return;
        }

        $user->notify(new ProjectStatusNotification(
            project: $project,
            event:   $this->event,
            reason:  $this->reason,
        ));
    }

    public function failed(\Throwable $exception): void
    {
        \Log::error("SendProjectNotification job failed for project {$this->project->id}: {$exception->getMessage()}");
    }
}