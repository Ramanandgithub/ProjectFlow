<?php

namespace App\Providers;

// use Illuminate\Support\ServiceProvider;
use App\Models\Project;
use App\Policies\ProjectPolicy;
use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;

class Authserviceprovider extends ServiceProvider
{
    protected $policies = [
        Project::class => ProjectPolicy::class,
    ];

    
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->registerPolicies();
    }
}
