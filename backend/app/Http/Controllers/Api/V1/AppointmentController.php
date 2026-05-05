<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Appointment\StoreAppointmentRequest;
use App\Http\Requests\Appointment\TransitionAppointmentRequest;
use App\Http\Requests\Appointment\UpdateAppointmentRequest;
use App\Http\Resources\AppointmentResource;
use App\Models\Appointment;
use App\Services\AppointmentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AppointmentController extends Controller
{
    public function __construct(private readonly AppointmentService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['status', 'customer_id', 'date']);

        return AppointmentResource::collection(
            $this->service->list($filters)
        );
    }

    public function store(StoreAppointmentRequest $request): JsonResponse
    {
        $appt = $this->service->create($request->validated());

        return (new AppointmentResource($appt))->response()->setStatusCode(201);
    }

    public function show(Appointment $appointment): AppointmentResource
    {
        $appointment->load(['customer:id,name', 'vehicle:id,plate,make,model,year']);

        return new AppointmentResource($appointment);
    }

    public function update(UpdateAppointmentRequest $request, Appointment $appointment): AppointmentResource
    {
        return new AppointmentResource(
            $this->service->update($appointment, $request->validated())
        );
    }

    public function destroy(Appointment $appointment): JsonResponse
    {
        $this->service->delete($appointment);

        return response()->json(null, 204);
    }

    public function transition(TransitionAppointmentRequest $request, Appointment $appointment): AppointmentResource|JsonResponse
    {
        try {
            return new AppointmentResource(
                $this->service->transition($appointment, $request->validated('status'))
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
