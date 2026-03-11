<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/
Route::get('/test', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is working',
    ]);
});
// ─── Public Auth Routes ───────────────────────────────────────────────────────
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// ─── Protected Routes (requires Sanctum token) ────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me',      [AuthController::class, 'me']);

    // Dashboard stats
    Route::get('/projects/stats', [ProjectController::class, 'stats']);

    // Projects - all authenticated users
    Route::get('/projects',         [ProjectController::class, 'index']);
    Route::post('/projects',        [ProjectController::class, 'store']);
    Route::get('/projects/{project}', [ProjectController::class, 'show']);
    Route::delete('/projects/{project}', [ProjectController::class, 'destroy']);

    Route::get('/projects/audit-logs', [ProjectController::class, 'showAuditLogs']);

    // Admin-only project actions
    Route::middleware('admin')->group(function () {
        Route::patch('/projects/{project}/approve', [ProjectController::class, 'approve']);
        Route::patch('/projects/{project}/reject',  [ProjectController::class, 'reject']);
        Route::post('/projects/bulk-action',        [ProjectController::class, 'bulkAction']);
        
    });
});