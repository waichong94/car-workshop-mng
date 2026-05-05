<?php

namespace App\Http\Requests\Part;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustStockRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'qty'  => ['required', 'integer', 'min:1'],
            'type' => ['required', 'string', Rule::in(['add', 'subtract'])],
        ];
    }
}
