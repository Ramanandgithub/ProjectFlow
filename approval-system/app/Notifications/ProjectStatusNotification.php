<?php

namespace App\Notifications;

use App\Models\Project;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ProjectStatusNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public readonly Project $project,
        public readonly string  $event,
        public readonly ?string $reason = null,
    ) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return match ($this->event) {
            'submitted' => $this->submittedMail($notifiable),
            'approved'  => $this->approvedMail($notifiable),
            'rejected'  => $this->rejectedMail($notifiable),
            default     => $this->submittedMail($notifiable),
        };
    }

    private function submittedMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Project Submitted: {$this->project->title}")
            ->greeting("Hello {$notifiable->name}!")
            ->line("Your project **\"{$this->project->title}\"** has been successfully submitted.")
            ->line("**Submission Time:** " . $this->project->submitted_at?->format('F j, Y g:i A'))
            ->line("**Status:** Pending Review")
            ->line("Our team will review your submission and notify you of the decision.")
            ->action('View Your Project', config('app.frontend_url') . "/projects/{$this->project->id}")
            ->line("Thank you for using the Project Approval System!");
    }

    private function approvedMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Project Approved: {$this->project->title}")
            ->greeting("Congratulations, {$notifiable->name}!")
            ->line("Great news! Your project **\"{$this->project->title}\"** has been **approved**.")
            ->line("**Decision Time:** " . now()->format('F j, Y g:i A'))
            ->when($this->reason, fn($mail) => $mail->line("**Admin Note:** {$this->reason}"))
            ->action('View Your Project', config('app.frontend_url') . "/projects/{$this->project->id}")
            ->line("Thank you for submitting your project!");
    }

    private function rejectedMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Project Rejected: {$this->project->title}")
            ->greeting("Hello {$notifiable->name},")
            ->line("We regret to inform you that your project **\"{$this->project->title}\"** has been **rejected**.")
            ->line("**Decision Time:** " . now()->format('F j, Y g:i A'))
            ->when($this->reason, fn($mail) => $mail->line("**Reason:** {$this->reason}"))
            ->line("You may revise and resubmit your project addressing the concerns mentioned above.")
            ->action('View Your Project', config('app.frontend_url') . "/projects/{$this->project->id}")
            ->line("If you have questions, please contact the administrator.");
    }

    public function toArray(object $notifiable): array
    {
        return [
            'project_id' => $this->project->id,
            'event'      => $this->event,
            'reason'     => $this->reason,
        ];
    }
}