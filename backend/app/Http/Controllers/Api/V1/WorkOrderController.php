<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkOrder\StoreWorkOrderRequest;
use App\Http\Requests\WorkOrder\TransitionWorkOrderRequest;
use App\Http\Requests\WorkOrder\UpdateWorkOrderRequest;
use App\Http\Resources\WorkOrderResource;
use App\Models\WorkOrder;
use App\Services\WorkOrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class WorkOrderController extends Controller
{
    public function __construct(private readonly WorkOrderService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $workOrders = $this->service->list(
            $request->only(['search', 'status', 'customer_id']),
            (int) $request->query('per_page', 15)
        );

        return WorkOrderResource::collection($workOrders);
    }

    public function store(StoreWorkOrderRequest $request): WorkOrderResource
    {
        return new WorkOrderResource($this->service->create($request->validated()));
    }

    public function show(WorkOrder $workOrder): WorkOrderResource
    {
        $workOrder->load([
            'customer:id,name,phone',
            'vehicle:id,plate,make,model,year',
            'assignedTo:id,name',
            'lines.service:id,name',
            'lines.part:id,name,sku',
        ]);

        return new WorkOrderResource($workOrder);
    }

    public function update(UpdateWorkOrderRequest $request, WorkOrder $workOrder): WorkOrderResource
    {
        return new WorkOrderResource($this->service->update($workOrder, $request->validated()));
    }

    public function destroy(WorkOrder $workOrder): JsonResponse
    {
        try {
            $this->service->delete($workOrder);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }

    public function transition(TransitionWorkOrderRequest $request, WorkOrder $workOrder): WorkOrderResource|JsonResponse
    {
        try {
            $workOrder = $this->service->transition($workOrder, $request->validated('status'));
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return new WorkOrderResource($workOrder);
    }
}
