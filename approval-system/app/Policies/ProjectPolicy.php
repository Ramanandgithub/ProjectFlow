<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    /**
     * Only admins can approve or reject projects.
     */
    public function approve(User $user, Project $project): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admins can perform bulk actions.
     */
    public function bulkAction(User $user): bool
    {
        return $user->isAdmin();
    }

    
    public function view(User $user, Project $project): bool
    {
        return $user->isAdmin() || $project->user_id === $user->id;
    }

    /**
     * Only the owning user can create projects (or admins for testing).
     */
    public function create(User $user): bool
    {
        return true; // All authenticated users can submit
    }

    
    public function delete(User $user, Project $project): bool
    {
        return $user->isAdmin() || $project->user_id === $user->id;
    }
}