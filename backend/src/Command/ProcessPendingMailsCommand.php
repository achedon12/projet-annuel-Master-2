<?php

namespace App\Command;

use App\Service\PendingMailProcessor;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:mail:process',
    description: 'Process pending emails in batches (default 50) with retries.',
)]
class ProcessPendingMailsCommand extends Command
{
    public function __construct(
        private PendingMailProcessor $processor,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'batch-size',
            null,
            InputOption::VALUE_REQUIRED,
            'Number of mails to process in one run',
            PendingMailProcessor::DEFAULT_BATCH_SIZE,
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $batchSize = (int) $input->getOption('batch-size');

        $stats = $this->processor->process($batchSize);

        if ($stats['processed'] === 0) {
            $io->writeln('<info>No pending mails to process.</info>');
            return Command::SUCCESS;
        }

        $io->success(sprintf(
            'Processed %d mail(s). Sent: %d, retry: %d, permanently failed: %d.',
            $stats['processed'],
            $stats['sent'],
            $stats['retry'],
            $stats['failed'],
        ));

        return Command::SUCCESS;
    }
}
