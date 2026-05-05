<?php

namespace App\Http\Requests\Invoice;

use App\Services\InvoiceService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(InvoiceService::ALLOWED_TARGET_STATUSES)],
        ];
    }
}
