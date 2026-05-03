<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vehicle\StoreVehicleRequest;
use App\Http\Requests\Vehicle\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use App\Services\VehicleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleController extends Controller
{
    public function __construct(private readonly VehicleService $service) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $vehicles = $this->service->list(
            $request->only(['search', 'customer_id']),
            (int) $request->query('per_page', 15)
        );

        return VehicleResource::collection($vehicles);
    }

    public function store(StoreVehicleRequest $request): VehicleResource
    {
        return new VehicleResource($this->service->create($request->validated()));
    }

    public function show(Vehicle $vehicle): VehicleResource
    {
        $vehicle->load('customer:id,name');

        return new VehicleResource($vehicle);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): VehicleResource
    {
        return new VehicleResource($this->service->update($vehicle, $request->validated()));
    }

    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $this->service->delete($vehicle);

        return response()->json(null, 204);
    }
}
