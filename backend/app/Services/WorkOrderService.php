<?php

namespace App\Services;

use App\Models\WorkOrder;
use App\Models\WorkOrderLine;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class WorkOrderService
{
    private const TRANSITIONS = [
        'draft'         => ['open', 'cancelled'],
        'open'          => ['in_progress', 'cancelled'],
        'in_progress'   => ['pending_parts', 'completed', 'cancelled'],
        'pending_parts' => ['in_progress', 'cancelled'],
        'completed'     => [],
        'cancelled'     => [],
    ];

    // Valid target statuses exposed for Form Request validation
    public const ALLOWED_TARGET_STATUSES = ['open', 'in_progress', 'pending_parts', 'completed', 'cancelled'];

    public function list(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = WorkOrder::with([
            'customer:id,name',
            'vehicle:id,plate,make,model,year',
        ])->select(['id', 'reference', 'status', 'customer_id', 'vehicle_id', 'description', 'mileage_in', 'created_at', 'updated_at']);

        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('reference', 'like', "%{$search}%")
                  ->orWhereHas('customer', fn ($c) => $c->where('name', 'like', "%{$search}%"));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        return $query->orderBy('created_at', 'desc')->paginate($perPage);
    }

    public function create(array $data): WorkOrder
    {
        return DB::transaction(function () use ($data) {
            $data['reference'] = $this->generateReference();

            $workOrder = WorkOrder::create($data);
            $workOrder->load([
                'customer:id,name,phone',
                'vehicle:id,plate,make,model,year',
                'assignedTo:id,name',
                'lines',
            ]);

            return $workOrder;
        });
    }

    public function update(WorkOrder $workOrder, array $data): WorkOrder
    {
        return DB::transaction(function () use ($workOrder, $data) {
            $workOrder->update($data);
            $workOrder->load([
                'customer:id,name,phone',
                'vehicle:id,plate,make,model,year',
                'assignedTo:id,name',
                'lines.service:id,name',
                'lines.part:id,name,sku',
            ]);

            return $workOrder;
        });
    }

    public function transition(WorkOrder $workOrder, string $newStatus): WorkOrder
    {
        $allowed = self::TRANSITIONS[$workOrder->status] ?? [];

        if (!in_array($newStatus, $allowed)) {
            throw new \InvalidArgumentException(
                "Cannot transition from '{$workOrder->status}' to '{$newStatus}'."
            );
        }

        return DB::transaction(function () use ($workOrder, $newStatus) {
            $timestamps = [];
            if ($newStatus === 'in_progress' && !$workOrder->started_at) {
                $timestamps['started_at'] = now();
            }
            if ($newStatus === 'completed') {
                $timestamps['completed_at'] = now();
            }

            $workOrder->update(['status' => $newStatus, ...$timestamps]);
            $workOrder->load([
                'customer:id,name,phone',
                'vehicle:id,plate,make,model,year',
                'assignedTo:id,name',
                'lines.service:id,name',
                'lines.part:id,name,sku',
            ]);

            return $workOrder;
        });
    }

    public function delete(WorkOrder $workOrder): void
    {
        if (!in_array($workOrder->status, ['draft', 'cancelled'])) {
            throw new \RuntimeException('Only draft or cancelled work orders can be deleted.');
        }

        $workOrder->delete();
    }

    public function addLine(WorkOrder $workOrder, array $data): WorkOrderLine
    {
        return DB::transaction(function () use ($workOrder, $data) {
            $data['work_order_id'] = $workOrder->id;

            $line = WorkOrderLine::create($data);
            $line->load('service:id,name', 'part:id,name,sku');

            return $line;
        });
    }

    public function updateLine(WorkOrder $workOrder, WorkOrderLine $line, array $data): WorkOrderLine
    {
        if ($line->work_order_id !== $workOrder->id) {
            throw new \InvalidArgumentException('Line does not belong to this work order.');
        }

        return DB::transaction(function () use ($line, $data) {
            $line->update($data);
            $line->load('service:id,name', 'part:id,name,sku');

            return $line;
        });
    }

    public function removeLine(WorkOrder $workOrder, WorkOrderLine $line): void
    {
        if ($line->work_order_id !== $workOrder->id) {
            throw new \InvalidArgumentException('Line does not belong to this work order.');
        }

        DB::transaction(fn () => $line->delete());
    }

    private function generateReference(): string
    {
        $year  = now()->year;
        $count = WorkOrder::withTrashed()->whereYear('created_at', $year)->lockForUpdate()->count();

        return sprintf('WO-%d-%04d', $year, $count + 1);
    }
}
