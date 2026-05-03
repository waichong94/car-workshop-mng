<?php

namespace App\Http\Requests\WorkOrder;

use Illuminate\Foundation\Http\FormRequest;

class UpdateWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['sometimes', 'required', 'integer', 'exists:customers,id'],
            'vehicle_id'  => ['sometimes', 'required', 'integer', 'exists:vehicles,id'],
            'assigned_to' => ['nullable', 'integer', 'exists:users,id'],
            'description' => ['nullable', 'string'],
            'mileage_in'  => ['nullable', 'integer', 'min:0'],
        ];
    }
}
