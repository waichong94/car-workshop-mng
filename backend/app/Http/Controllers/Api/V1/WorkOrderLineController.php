<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\WorkOrderLine\StoreWorkOrderLineRequest;
use App\Http\Requests\WorkOrderLine\UpdateWorkOrderLineRequest;
use App\Http\Resources\WorkOrderLineResource;
use App\Models\WorkOrder;
use App\Models\WorkOrderLine;
use App\Services\WorkOrderService;
use Illuminate\Http\JsonResponse;

class WorkOrderLineController extends Controller
{
    public function __construct(private readonly WorkOrderService $service) {}

    public function store(StoreWorkOrderLineRequest $request, WorkOrder $workOrder): WorkOrderLineResource
    {
        $line = $this->service->addLine($workOrder, $request->validated());

        return new WorkOrderLineResource($line);
    }

    public function update(
        UpdateWorkOrderLineRequest $request,
        WorkOrder $workOrder,
        WorkOrderLine $line
    ): WorkOrderLineResource|JsonResponse {
        try {
            $line = $this->service->updateLine($workOrder, $line, $request->validated());
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return new WorkOrderLineResource($line);
    }

    public function destroy(WorkOrder $workOrder, WorkOrderLine $line): JsonResponse
    {
        try {
            $this->service->removeLine($workOrder, $line);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }
}
