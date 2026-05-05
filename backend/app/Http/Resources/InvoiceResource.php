<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'invoice_number' => $this->invoice_number,
            'status'         => $this->status,
            'subtotal'       => $this->subtotal,
            'tax_rate'       => $this->tax_rate,
            'tax_amount'     => $this->tax_amount,
            'discount'       => $this->discount,
            'total'          => $this->total,
            'issued_at'      => $this->issued_at?->toDateString(),
            'due_at'         => $this->due_at?->toDateString(),
            'paid_at'        => $this->paid_at?->toDateString(),
            'notes'          => $this->notes,
            'work_order'     => $this->whenLoaded('workOrder', fn () => [
                'id'        => $this->workOrder->id,
                'reference' => $this->workOrder->reference,
                'status'    => $this->workOrder->status,
            ]),
            'customer'       => $this->whenLoaded('customer', fn () => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'created_at'     => $this->created_at->toDateTimeString(),
            'updated_at'     => $this->updated_at->toDateTimeString(),
        ];
    }
}
