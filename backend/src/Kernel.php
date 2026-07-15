<?php

namespace App;

use Symfony\Bundle\FrameworkBundle\Kernel\MicroKernelTrait;
use Symfony\Component\HttpKernel\Kernel as BaseKernel;

/**
 * Le CORS est géré par nelmio/cors-bundle (config/packages/nelmio_cors.yaml),
 * piloté par la variable d'environnement CORS_ALLOW_ORIGIN.
 *
 * Il ne faut PAS le réimplémenter ici : un subscriber sur RequestEvent
 * intercepterait les OPTIONS avant le listener de nelmio et court-circuiterait
 * la config, avec une liste d'origines forcément codée en dur.
 */
class Kernel extends BaseKernel
{
    use MicroKernelTrait;
}
