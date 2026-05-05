<?php

namespace App\Http\Requests\Appointment;

use App\Services\AppointmentService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransitionAppointmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'status' => ['required', 'string', Rule::in(AppointmentService::ALLOWED_TARGET_STATUSES)],
        ];
    }
}
