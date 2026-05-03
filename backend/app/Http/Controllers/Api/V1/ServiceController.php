<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\ServiceResource;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ServiceController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Service::select(['id', 'name', 'default_price'])
            ->where('is_active', true);

        if ($search = $request->query('search')) {
            $query->where('name', 'like', "%{$search}%");
        }

        $services = $query->orderBy('name')->get();

        return ServiceResource::collection($services);
    }
}
