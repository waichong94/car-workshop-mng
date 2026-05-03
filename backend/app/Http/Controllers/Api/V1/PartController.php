<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\PartResource;
use App\Models\Part;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PartController extends Controller
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Part::select(['id', 'name', 'sku', 'unit_price', 'stock_qty']);

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $parts = $query->orderBy('name')->paginate($request->query('per_page', 50));

        return PartResource::collection($parts);
    }
}
