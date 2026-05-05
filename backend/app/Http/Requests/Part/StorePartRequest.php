<?php

namespace App\Http\Requests\Part;

use Illuminate\Foundation\Http\FormRequest;

class StorePartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'          => ['required', 'string', 'max:255'],
            'sku'           => ['nullable', 'string', 'max:100', 'unique:parts,sku'],
            'description'   => ['nullable', 'string', 'max:2000'],
            'unit_cost'     => ['required', 'numeric', 'min:0'],
            'unit_price'    => ['required', 'numeric', 'min:0'],
            'stock_qty'     => ['nullable', 'integer', 'min:0'],
            'reorder_level' => ['nullable', 'integer', 'min:0'],
        ];
    }
}
