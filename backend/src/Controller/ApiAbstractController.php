<?php

namespace App\Controller;

use App\Service\IpBanService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;

/**
 * Classe abstraite pour tous les controllers API
 *
 * Inclut automatiquement la vérification du ban IP via le trait
 * et injecte le service IpBanService
 */
abstract class ApiAbstractController extends AbstractController
{

    public function __construct(
    ) {}
}

