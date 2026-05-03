<?php

namespace App\Http\Requests\WorkOrderLine;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkOrderLineRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'type'        => ['required', 'in:service,part,labour,other'],
            'service_id'  => ['nullable', 'integer', 'exists:services,id', 'required_if:type,service'],
            'part_id'     => ['nullable', 'integer', 'exists:parts,id', 'required_if:type,part'],
            'description' => ['required', 'string', 'max:255'],
            'qty'         => ['required', 'numeric', 'min:0.01'],
            'unit_price'  => ['required', 'numeric', 'min:0'],
            'discount'    => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }
}
