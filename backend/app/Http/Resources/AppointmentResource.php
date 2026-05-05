<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AppointmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'status'       => $this->status,
            'scheduled_at' => $this->scheduled_at?->toDateTimeString(),
            'notes'        => $this->notes,
            'customer'     => $this->whenLoaded('customer', fn () => [
                'id'   => $this->customer->id,
                'name' => $this->customer->name,
            ]),
            'vehicle'      => $this->whenLoaded('vehicle', fn () => [
                'id'    => $this->vehicle->id,
                'plate' => $this->vehicle->plate,
                'make'  => $this->vehicle->make,
                'model' => $this->vehicle->model,
                'year'  => $this->vehicle->year,
            ]),
            'created_at'   => $this->created_at->toDateTimeString(),
            'updated_at'   => $this->updated_at->toDateTimeString(),
        ];
    }
}
