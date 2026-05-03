<?php

namespace App\Http\Requests\Vehicle;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVehicleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $vehicleId = $this->route('vehicle')->id;

        return [
            'plate'   => ['sometimes', 'required', 'string', 'max:20', Rule::unique('vehicles', 'plate')->ignore($vehicleId)],
            'make'    => ['sometimes', 'required', 'string', 'max:50'],
            'model'   => ['sometimes', 'required', 'string', 'max:50'],
            'year'    => ['sometimes', 'required', 'integer', 'min:1900', 'max:' . (date('Y') + 1)],
            'color'   => ['nullable', 'string', 'max:30'],
            'vin'     => ['nullable', 'string', 'size:17', Rule::unique('vehicles', 'vin')->ignore($vehicleId)],
            'mileage' => ['nullable', 'integer', 'min:0'],
            'notes'   => ['nullable', 'string'],
        ];
    }
}
