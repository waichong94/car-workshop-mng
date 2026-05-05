<?php

namespace App\Services;

use App\Models\Invoice;
use App\Models\WorkOrder;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class InvoiceService
{
    private const TRANSITIONS = [
        'draft'  => ['issued', 'void'],
        'issued' => ['paid', 'void'],
        'paid'   => [],
        'void'   => [],
    ];

    public const ALLOWED_TARGET_STATUSES = ['issued', 'paid', 'void'];

    public function list(array $filters = [], int $perPage = 20): LengthAwarePaginator
    {
        $query = Invoice::query()
            ->select([
                'id', 'invoice_number', 'work_order_id', 'customer_id',
                'subtotal', 'tax_rate', 'tax_amount', 'discount', 'total',
                'status', 'issued_at', 'due_at', 'paid_at',
                'created_at', 'updated_at',
            ])
            ->with(['workOrder:id,reference,status', 'customer:id,name']);

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['customer_id'])) {
            $query->where('customer_id', $filters['customer_id']);
        }

        return $query->orderByDesc('created_at')->paginate($perPage);
    }

    public function generateFromWorkOrder(WorkOrder $workOrder, array $data = []): Invoice
    {
        if ($workOrder->status !== 'completed') {
            throw new \RuntimeException('Invoices can only be generated for completed work orders.');
        }

        if ($workOrder->invoice()->exists()) {
            throw new \RuntimeException('This work order already has an invoice.');
        }

        $workOrder->load('lines');

        $subtotal  = round($workOrder->lines->sum('line_total'), 2);
        $taxRate   = round((float) ($data['tax_rate'] ?? 0), 2);
        $taxAmount = round($subtotal * $taxRate / 100, 2);
        $discount  = round((float) ($data['discount'] ?? 0), 2);
        $total     = round($subtotal + $taxAmount - $discount, 2);

        return DB::transaction(function () use ($workOrder, $data, $subtotal, $taxRate, $taxAmount, $discount, $total) {
            $invoice = Invoice::create([
                'invoice_number' => 'TEMP-' . uniqid(),
                'work_order_id'  => $workOrder->id,
                'customer_id'    => $workOrder->customer_id,
                'subtotal'       => $subtotal,
                'tax_rate'       => $taxRate,
                'tax_amount'     => $taxAmount,
                'discount'       => $discount,
                'total'          => $total,
                'status'         => 'draft',
                'notes'          => $data['notes'] ?? null,
                'due_at'         => $data['due_at'] ?? null,
            ]);

            $invoice->update([
                'invoice_number' => 'INV-' . now()->format('Y') . '-' . str_pad($invoice->id, 6, '0', STR_PAD_LEFT),
            ]);

            $invoice->load(['workOrder:id,reference,status', 'customer:id,name']);

            return $invoice;
        });
    }

    public function update(Invoice $invoice, array $data): Invoice
    {
        if ($invoice->status !== 'draft') {
            throw new \RuntimeException('Only draft invoices can be edited.');
        }

        return DB::transaction(function () use ($invoice, $data) {
            if (isset($data['tax_rate']) || isset($data['discount'])) {
                $taxRate   = round((float) ($data['tax_rate'] ?? $invoice->tax_rate), 2);
                $taxAmount = round((float) $invoice->subtotal * $taxRate / 100, 2);
                $discount  = round((float) ($data['discount'] ?? $invoice->discount), 2);
                $total     = round((float) $invoice->subtotal + $taxAmount - $discount, 2);

                $data['tax_rate']   = $taxRate;
                $data['tax_amount'] = $taxAmount;
                $data['discount']   = $discount;
                $data['total']      = $total;
            }

            $invoice->update($data);
            $invoice->load(['workOrder:id,reference,status', 'customer:id,name']);

            return $invoice;
        });
    }

    public function transition(Invoice $invoice, string $target): Invoice
    {
        $allowed = self::TRANSITIONS[$invoice->status] ?? [];

        if (!in_array($target, $allowed, true)) {
            throw new \InvalidArgumentException(
                "Cannot transition from {$invoice->status} to {$target}."
            );
        }

        return DB::transaction(function () use ($invoice, $target) {
            $invoice->status = $target;

            if ($target === 'issued') {
                $invoice->issued_at = now();
            } elseif ($target === 'paid') {
                $invoice->paid_at = now();
            }

            $invoice->save();
            $invoice->load(['workOrder:id,reference,status', 'customer:id,name']);

            return $invoice;
        });
    }

    public function delete(Invoice $invoice): void
    {
        if ($invoice->status !== 'draft') {
            throw new \RuntimeException('Only draft invoices can be deleted.');
        }

        $invoice->delete();
    }
}
