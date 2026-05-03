<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehicleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'customer_id' => $this->customer_id,
            'customer'    => $this->whenLoaded('customer', fn () => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'plate'       => $this->plate,
            'make'        => $this->make,
            'model'       => $this->model,
            'year'        => $this->year,
            'color'       => $this->color,
            'vin'         => $this->vin,
            'mileage'     => $this->mileage,
            'notes'       => $this->notes,
            'created_at'  => $this->created_at->toDateTimeString(),
            'updated_at'  => $this->updated_at->toDateTimeString(),
        ];
    }
}
