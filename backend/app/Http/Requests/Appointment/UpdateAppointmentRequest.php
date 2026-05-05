<?php

namespace App\Http\Requests\Appointment;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'customer_id'  => ['sometimes', 'integer', 'exists:customers,id'],
            'vehicle_id'   => ['sometimes', 'integer', 'exists:vehicles,id'],
            'scheduled_at' => ['sometimes', 'date_format:Y-m-d H:i:s'],
            'notes'        => ['sometimes', 'nullable', 'string', 'max:1000'],
        ];
    }
}
