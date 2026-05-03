<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Vehicle\StoreVehicleRequest;
use App\Http\Requests\Vehicle\UpdateVehicleRequest;
use App\Http\Resources\VehicleResource;
use App\Models\Vehicle;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehicleController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Vehicle::with('customer');

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('plate', 'like', "%{$search}%")
                  ->orWhere('make', 'like', "%{$search}%")
                  ->orWhere('model', 'like', "%{$search}%");
            });
        }

        if ($customerId = $request->query('customer_id')) {
            $query->where('customer_id', $customerId);
        }

        $vehicles = $query->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 15));

        return VehicleResource::collection($vehicles);
    }

    public function store(StoreVehicleRequest $request): VehicleResource
    {
        $vehicle = Vehicle::create($request->validated());
        $vehicle->load('customer');

        return new VehicleResource($vehicle);
    }

    public function show(Vehicle $vehicle): VehicleResource
    {
        $vehicle->load('customer');

        return new VehicleResource($vehicle);
    }

    public function update(UpdateVehicleRequest $request, Vehicle $vehicle): VehicleResource
    {
        $vehicle->update($request->validated());
        $vehicle->load('customer');

        return new VehicleResource($vehicle);
    }

    public function destroy(Vehicle $vehicle): JsonResponse
    {
        $vehicle->delete();

        return response()->json(null, 204);
    }
}
