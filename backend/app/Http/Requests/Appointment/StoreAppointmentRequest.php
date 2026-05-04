<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class StoreAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id'  => ['required', 'integer', 'exists:customers,id'],
            'vehicle_id'   => ['required', 'integer', 'exists:vehicles,id'],
            'scheduled_at' => ['required', 'date_format:Y-m-d H:i:s'],
            'notes'        => ['nullable', 'string', 'max:1000'],
        ];
    }
}
