<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Invoice\GenerateInvoiceRequest;
use App\Http\Requests\Invoice\TransitionInvoiceRequest;
use App\Http\Requests\Invoice\UpdateInvoiceRequest;
use App\Http\Resources\InvoiceResource;
use App\Models\Invoice;
use App\Models\WorkOrder;
use App\Services\InvoiceService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class InvoiceController extends Controller
{
    public function __construct(private readonly InvoiceService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['status', 'customer_id']);

        return InvoiceResource::collection($this->service->list($filters));
    }

    public function store(GenerateInvoiceRequest $request): JsonResponse
    {
        try {
            $workOrder = WorkOrder::findOrFail($request->validated('work_order_id'));
            $invoice   = $this->service->generateFromWorkOrder($workOrder, $request->validated());

            return (new InvoiceResource($invoice))->response()->setStatusCode(201);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function show(Invoice $invoice): InvoiceResource
    {
        $invoice->load(['workOrder:id,reference,status', 'customer:id,name']);

        return new InvoiceResource($invoice);
    }

    public function update(UpdateInvoiceRequest $request, Invoice $invoice): InvoiceResource|JsonResponse
    {
        try {
            return new InvoiceResource($this->service->update($invoice, $request->validated()));
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    public function destroy(Invoice $invoice): JsonResponse
    {
        try {
            $this->service->delete($invoice);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        return response()->json(null, 204);
    }

    public function transition(TransitionInvoiceRequest $request, Invoice $invoice): InvoiceResource|JsonResponse
    {
        try {
            return new InvoiceResource(
                $this->service->transition($invoice, $request->validated('status'))
            );
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
