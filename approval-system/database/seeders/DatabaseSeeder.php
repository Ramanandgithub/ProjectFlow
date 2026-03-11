<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Project;


class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::create([
            'name'     => 'Admin User',
            'email'    => 'admin@gmail.com',
            'password' => Hash::make('123456'),
            'role'     => 'admin',
        ]);

        // Create regular users
        $users = [
            ['name' => 'Abhishek', 'email' => 'abhishek@gmail.com'],
            ['name' => 'Boby',     'email' => 'boby@gmail.com'],
            ['name' => 'Karan',   'email' => 'karan@gmail.com'],
        ];

        foreach ($users as $userData) {
            User::create([
                'name'     => $userData['name'],
                'email'    => $userData['email'],
                'password' => Hash::make('123456'),
                'role'     => 'user',
            ]);
        }

        // Create sample projects for each user
        $statuses = ['pending', 'approved', 'rejected'];
        $regularUsers = User::where('role', 'user')->get();

        foreach ($regularUsers as $user) {
            for ($i = 1; $i <= 3; $i++) {
                Project::create([
                    'title'        => "Project {$i} by {$user->name}",
                    'description'  => "This is a sample project description for project {$i}. It contains important details about the project scope, objectives, and expected outcomes.",
                    'status'       => $statuses[array_rand($statuses)],
                    'user_id'      => $user->id,
                    'files'        => null,
                    'submitted_at' => now()->subDays(rand(1, 30)),
                ]);
            }
        }
    }
    
}
