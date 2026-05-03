<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WorkOrderLine extends Model
{
    protected $fillable = [
        'work_order_id', 'type', 'service_id', 'part_id',
        'description', 'qty', 'unit_price', 'discount',
    ];

    protected function casts(): array
    {
        return [
            'qty'        => 'float',
            'unit_price' => 'float',
            'discount'   => 'float',
        ];
    }

    public function workOrder(): BelongsTo
    {
        return $this->belongsTo(WorkOrder::class);
    }

    public function service(): BelongsTo
    {
        return $this->belongsTo(Service::class);
    }

    public function part(): BelongsTo
    {
        return $this->belongsTo(Part::class);
    }

    public function getLineTotalAttribute(): float
    {
        $gross = $this->qty * $this->unit_price;
        return round($gross - ($gross * $this->discount / 100), 2);
    }
}
