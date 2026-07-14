<?php

namespace App\Scheduler;

use App\Message\ArchiveExpiredArticlesMessage;
use Symfony\Component\Scheduler\Attribute\AsSchedule;
use Symfony\Component\Scheduler\RecurringMessage;
use Symfony\Component\Scheduler\Schedule;
use Symfony\Component\Scheduler\ScheduleProviderInterface;

/**
 * Schedule "article" : déclenche l'archivage léger une fois par jour.
 *
 * Worker à lancer : php bin/console messenger:consume scheduler_article
 */
#[AsSchedule('article')]
final class ArticleSchedule implements ScheduleProviderInterface
{
    public function getSchedule(): Schedule
    {
        return (new Schedule())
            ->add(
                RecurringMessage::every('1 day', new ArchiveExpiredArticlesMessage()),
            );
    }
}
