<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    protected $fillable = ['name', 'description', 'default_price', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }
}
