<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('action'); // e.g., 'submitted', 'approved', 'rejected', 'bulk_approved'
            $table->text('notes')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('performed_at');
            $table->timestamps();

            $table->index(['project_id', 'action']);
            $table->index('user_id');
            $table->index('performed_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
    }
};
