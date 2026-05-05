<?php

namespace App\Services;

use App\Models\Part;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class PartService
{
    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Part::query()
            ->select(['id', 'name', 'sku', 'description', 'unit_cost', 'unit_price', 'stock_qty', 'reorder_level', 'created_at', 'updated_at']);

        if (!empty($filters['search'])) {
            $query->where(function ($q) use ($filters) {
                $q->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('sku', 'like', '%' . $filters['search'] . '%');
            });
        }

        if (!empty($filters['low_stock'])) {
            $query->whereColumn('stock_qty', '<=', 'reorder_level')
                  ->where('reorder_level', '>', 0);
        }

        return $query->orderBy('name')->paginate($perPage);
    }

    public function create(array $data): Part
    {
        return DB::transaction(fn () => Part::create($data));
    }

    public function update(Part $part, array $data): Part
    {
        return DB::transaction(function () use ($part, $data) {
            $part->update($data);
            return $part->fresh();
        });
    }

    public function adjustStock(Part $part, int $qty, string $type): Part
    {
        return DB::transaction(function () use ($part, $qty, $type) {
            if ($type === 'add') {
                $part->increment('stock_qty', $qty);
            } else {
                if ($part->stock_qty < $qty) {
                    throw new \RuntimeException(
                        "Cannot subtract {$qty} units — only {$part->stock_qty} in stock."
                    );
                }
                $part->decrement('stock_qty', $qty);
            }

            return $part->fresh();
        });
    }

    public function delete(Part $part): void
    {
        $part->delete();
    }
}
