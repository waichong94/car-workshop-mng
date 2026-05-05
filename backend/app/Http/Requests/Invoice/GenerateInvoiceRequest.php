<?php

namespace App\Http\Requests\Invoice;

use Illuminate\Foundation\Http\FormRequest;

class GenerateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'work_order_id' => ['required', 'integer', 'exists:work_orders,id'],
            'tax_rate'      => ['nullable', 'numeric', 'min:0', 'max:100'],
            'discount'      => ['nullable', 'numeric', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:1000'],
            'due_at'        => ['nullable', 'date'],
        ];
    }
}
