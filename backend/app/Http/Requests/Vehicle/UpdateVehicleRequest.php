<?php

namespace App\Http\Requests\Vehicle;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'plate'   => ['sometimes', 'required', 'string', 'max:20'],
            'make'    => ['sometimes', 'required', 'string', 'max:50'],
            'model'   => ['sometimes', 'required', 'string', 'max:50'],
            'year'    => ['sometimes', 'required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color'   => ['nullable', 'string', 'max:30'],
            'vin'     => ['nullable', 'string', 'max:17'],
            'mileage' => ['nullable', 'integer', 'min:0'],
            'notes'   => ['nullable', 'string'],
        ];
    }
}
