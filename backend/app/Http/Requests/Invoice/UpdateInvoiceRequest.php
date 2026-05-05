<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tax_rate'  => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'discount'  => ['sometimes', 'numeric', 'min:0'],
            'notes'     => ['sometimes', 'nullable', 'string', 'max:1000'],
            'due_at'    => ['sometimes', 'nullable', 'date'],
            'issued_at' => ['sometimes', 'nullable', 'date'],
        ];
    }
}
