<?php

namespace App\Command;

use App\Service\ArticleLifecycleService;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:articles:archive',
    description: 'Archivage léger des articles publiés au-delà de la rétention (corps purgé, thématique + liens conservés).',
)]
class ArchiveExpiredArticlesCommand extends Command
{
    public function __construct(
        private readonly ArticleLifecycleService $lifecycle,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this->addOption(
            'retention-days',
            null,
            InputOption::VALUE_REQUIRED,
            'Durée de rétention avant archivage (jours)',
            ArticleLifecycleService::RETENTION_DAYS,
        );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);
        $days = (int) $input->getOption('retention-days');

        $count = $this->lifecycle->archiveExpired($days);

        if ($count === 0) {
            $io->writeln('<info>Aucun article à archiver.</info>');
            return Command::SUCCESS;
        }

        $io->success(sprintf('%d article(s) archivé(s) (corps purgé, liens conservés).', $count));

        return Command::SUCCESS;
    }
}
