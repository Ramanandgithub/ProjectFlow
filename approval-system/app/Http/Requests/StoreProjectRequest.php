<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreProjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Route is protected by auth middleware
    }

    public function rules(): array
    {
        return [
            'title'       => ['required', 'string', 'min:3', 'max:255'],
            'description' => ['required', 'string', 'min:10', 'max:5000'],
            'files'       => ['nullable', 'array', 'max:5'],
            'files.*'     => [
                'file',
                'max:10240', // 10MB per file
                'mimes:pdf,doc,docx,xls,xlsx,ppt,pptx,jpg,jpeg,png,gif,zip,rar',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'title.required'       => 'Project title is required.',
            'title.min'            => 'Title must be at least 3 characters.',
            'description.required' => 'Project description is required.',
            'description.min'      => 'Description must be at least 10 characters.',
            'files.max'            => 'You can upload a maximum of 5 files.',
            'files.*.max'          => 'Each file must not exceed 10MB.',
            'files.*.mimes'        => 'Allowed file types: PDF, Word, Excel, PowerPoint, images, ZIP.',
        ];
    }
}