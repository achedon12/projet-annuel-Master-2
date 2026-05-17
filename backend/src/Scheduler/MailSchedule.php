<?php

namespace App\Scheduler;

use App\Message\ProcessPendingMailsMessage;
use Symfony\Component\Scheduler\Attribute\AsSchedule;
use Symfony\Component\Scheduler\RecurringMessage;
use Symfony\Component\Scheduler\Schedule;
use Symfony\Component\Scheduler\ScheduleProviderInterface;

/**
 * Schedule "mail" : déclenche le traitement de la queue toutes les minutes.
 *
 * Worker à lancer : php bin/console messenger:consume scheduler_mail
 */
#[AsSchedule('mail')]
final class MailSchedule implements ScheduleProviderInterface
{
    public function getSchedule(): Schedule
    {
        return (new Schedule())
            ->add(
                RecurringMessage::every('1 minute', new ProcessPendingMailsMessage(50)),
            );
    }
}
