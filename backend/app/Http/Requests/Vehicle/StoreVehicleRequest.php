<?php

namespace App\Http\Requests\Vehicle;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'customer_id' => ['required', 'integer', 'exists:customers,id'],
            'plate'       => ['required', 'string', 'max:20'],
            'make'        => ['required', 'string', 'max:50'],
            'model'       => ['required', 'string', 'max:50'],
            'year'        => ['required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color'       => ['nullable', 'string', 'max:30'],
            'vin'         => ['nullable', 'string', 'max:17'],
            'mileage'     => ['nullable', 'integer', 'min:0'],
            'notes'       => ['nullable', 'string'],
        ];
    }
}
