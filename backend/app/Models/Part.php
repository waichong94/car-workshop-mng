<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Part extends Model
{
    protected $fillable = ['name', 'sku', 'description', 'unit_cost', 'unit_price', 'stock_qty', 'reorder_level'];
}
