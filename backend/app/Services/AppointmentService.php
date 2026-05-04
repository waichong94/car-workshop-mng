<?php

namespace App\Services;

use App\Models\Appointment;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AppointmentService
{
    public const TRANSITIONS = [
        'pending'     => ['confirmed', 'cancelled'],
        'confirmed'   => ['in_progress', 'cancelled'],
        'in_progress' => ['completed', 'cancelled'],
        'completed'   => [],
        'cancelled'   => [],
    ];

    public const ALLOWED_TARGET_STATUSES = ['confirmed', 'in_progress', 'completed', 'cancelled'];

    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Appointment::query()
            ->select(['id', 'customer_id', 'vehicle_id', 'scheduled_at', 'status', 'notes', 'created_at', 'updated_at'])
            ->with(['customer:id,name', 'vehicle:id,plate,make,model']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        if (!empty($filters['date'])) {
            if ($filters['date'] === 'today') {
                $query->whereDate('scheduled_at', today());
            } elseif ($filters['date'] === 'week') {
                $query->whereBetween('scheduled_at', [
                    now()->startOfWeek(),
                    now()->endOfWeek(),
                ]);
            }
        }

        return $query->orderBy('scheduled_at')->paginate($perPage);
    }

    public function create(array $data): Appointment
    {
        unset($data['status']);

        return DB::transaction(function () use ($data) {
            $appt = Appointment::create($data + ['status' => 'pending']);
            $appt->load(['customer:id,name', 'vehicle:id,plate,make,model']);

            return $appt;
        });
    }

    public function update(Appointment $appt, array $data): Appointment
    {
        unset($data['status']);

        return DB::transaction(function () use ($appt, $data) {
            $appt->update($data);
            $appt->load(['customer:id,name', 'vehicle:id,plate,make,model']);

            return $appt;
        });
    }

    public function transition(Appointment $appt, string $target): Appointment
    {
        $allowed = self::TRANSITIONS[$appt->status] ?? [];

        if (!in_array($target, $allowed, true)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$appt->status} to {$target}."
            );
        }

        $appt->status = $target;
        $appt->save();
        $appt->load(['customer:id,name', 'vehicle:id,plate,make,model']);

        return $appt;
    }

    public function delete(Appointment $appt): void
    {
        $appt->delete();
    }
}
