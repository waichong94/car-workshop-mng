<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Part\AdjustStockRequest;
use App\Http\Requests\Part\StorePartRequest;
use App\Http\Requests\Part\UpdatePartRequest;
use App\Http\Resources\PartResource;
use App\Models\Part;
use App\Services\PartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartController extends Controller
{
    public function __construct(private readonly PartService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'low_stock']);

        return PartResource::collection(
            $this->service->list($filters, (int) $request->query('per_page', 20))
        );
    }

    public function store(StorePartRequest $request): JsonResponse
    {
        $part = $this->service->create($request->validated());

        return (new PartResource($part))->response()->setStatusCode(201);
    }

    public function show(Part $part): PartResource
    {
        return new PartResource($part);
    }

    public function update(UpdatePartRequest $request, Part $part): PartResource
    {
        return new PartResource($this->service->update($part, $request->validated()));
    }

    public function destroy(Part $part): JsonResponse
    {
        $this->service->delete($part);

        return response()->json(null, 204);
    }

    public function adjustStock(AdjustStockRequest $request, Part $part): PartResource|JsonResponse
    {
        try {
            return new PartResource(
                $this->service->adjustStock($part, $request->validated('qty'), $request->validated('type'))
            );
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
