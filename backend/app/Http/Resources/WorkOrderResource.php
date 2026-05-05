<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkOrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'reference'    => $this->reference,
            'status'       => $this->status,
            'description'  => $this->description,
            'mileage_in'   => $this->mileage_in,
            'customer'     => $this->whenLoaded('customer', fn () => [
                'id'    => $this->customer->id,
                'name'  => $this->customer->name,
                'phone' => $this->customer->phone,
            ]),
            'vehicle'      => $this->whenLoaded('vehicle', fn () => [
                'id'    => $this->vehicle->id,
                'plate' => $this->vehicle->plate,
                'make'  => $this->vehicle->make,
                'model' => $this->vehicle->model,
                'year'  => $this->vehicle->year,
            ]),
            'assigned_to'  => $this->whenLoaded('assignedTo', fn () => $this->assignedTo ? [
                'id'   => $this->assignedTo->id,
                'name' => $this->assignedTo->name,
            ] : null),
            'lines'        => $this->when(
                $this->relationLoaded('lines'),
                fn () => WorkOrderLineResource::collection($this->lines)
            ),
            'totals'       => $this->when(
                $this->relationLoaded('lines'),
                fn () => [
                    'subtotal' => round($this->lines->sum('line_total'), 2),
                    'tax'      => 0,
                    'total'    => round($this->lines->sum('line_total'), 2),
                ]
            ),
            'invoice'      => $this->whenLoaded('invoice', fn () => $this->invoice ? [
                'id'             => $this->invoice->id,
                'invoice_number' => $this->invoice->invoice_number,
                'status'         => $this->invoice->status,
            ] : null),
            'started_at'   => $this->started_at?->toDateTimeString(),
            'completed_at' => $this->completed_at?->toDateTimeString(),
            'created_at'   => $this->created_at->toDateTimeString(),
            'updated_at'   => $this->updated_at->toDateTimeString(),
        ];
    }
}
