<?php

namespace App\Http\Requests\Part;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['sometimes', 'string', 'max:255'],
            'sku'           => ['sometimes', 'nullable', 'string', 'max:100', Rule::unique('parts', 'sku')->ignore($this->route('part'))],
            'description'   => ['sometimes', 'nullable', 'string', 'max:2000'],
            'unit_cost'     => ['sometimes', 'numeric', 'min:0'],
            'unit_price'    => ['sometimes', 'numeric', 'min:0'],
            'reorder_level' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
