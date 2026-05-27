<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\DB;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        DB::listen(function ($query) {

            logger('SQL: ' . $query->sql);
            logger('Bindings: ' . json_encode($query->bindings));
            logger('Time: ' . $query->time . ' ms');

        });
    }
}