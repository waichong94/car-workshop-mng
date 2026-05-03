<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkOrderLineResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'work_order_id' => $this->work_order_id,
            'type'          => $this->type,
            'description'   => $this->description,
            'qty'           => $this->qty,
            'unit_price'    => $this->unit_price,
            'discount'      => $this->discount,
            'line_total'    => $this->line_total,
            'service'       => $this->whenLoaded('service', fn () => $this->service ? [
                'id'   => $this->service->id,
                'name' => $this->service->name,
            ] : null),
            'part'          => $this->whenLoaded('part', fn () => $this->part ? [
                'id'   => $this->part->id,
                'name' => $this->part->name,
                'sku'  => $this->part->sku,
            ] : null),
        ];
    }
}
