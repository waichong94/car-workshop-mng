<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\PartController;
use App\Http\Controllers\Api\V1\ServiceController;
use App\Http\Controllers\Api\V1\VehicleController;
use App\Http\Controllers\Api\V1\WorkOrderController;
use App\Http\Controllers\Api\V1\WorkOrderLineController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Auth
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);

        // Customers
        Route::apiResource('customers', CustomerController::class);

        // Vehicles
        Route::apiResource('vehicles', VehicleController::class);

        // Work Orders
        Route::apiResource('work-orders', WorkOrderController::class);
        Route::patch('work-orders/{workOrder}/transition', [WorkOrderController::class, 'transition']);

        // Work Order Lines (nested under work order)
        Route::post('work-orders/{workOrder}/lines', [WorkOrderLineController::class, 'store']);
        Route::put('work-orders/{workOrder}/lines/{line}', [WorkOrderLineController::class, 'update']);
        Route::delete('work-orders/{workOrder}/lines/{line}', [WorkOrderLineController::class, 'destroy']);

        // Catalog (for pickers)
        Route::get('services', [ServiceController::class, 'index']);
        Route::get('parts', [PartController::class, 'index']);
    });
});
