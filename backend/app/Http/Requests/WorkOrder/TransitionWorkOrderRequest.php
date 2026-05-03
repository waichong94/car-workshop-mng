<?php

namespace App\Http\Requests\WorkOrder;

use App\Services\WorkOrderService;
use Illuminate\Foundation\Http\FormRequest;

class TransitionWorkOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        $allowed = implode(',', WorkOrderService::ALLOWED_TARGET_STATUSES);

        return [
            'status' => ['required', "in:{$allowed}"],
        ];
    }
}
