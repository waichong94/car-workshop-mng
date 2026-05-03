<?php

namespace App\Http\Requests\WorkOrderLine;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkOrderLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type'        => ['sometimes', 'required', 'in:service,part,labour,other'],
            'service_id'  => ['nullable', 'integer', 'exists:services,id'],
            'part_id'     => ['nullable', 'integer', 'exists:parts,id'],
            'description' => ['sometimes', 'required', 'string', 'max:255'],
            'qty'         => ['sometimes', 'required', 'numeric', 'min:0.01'],
            'unit_price'  => ['sometimes', 'required', 'numeric', 'min:0'],
            'discount'    => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
