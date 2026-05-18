<?php

namespace App\Command;

use App\Entity\User;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

/**
 * Promeut (ou rétrograde) un utilisateur en lui assignant un rôle.
 *
 * Seul moyen de créer le premier admin du système : aucune UI ne permet
 * d'auto-promotion. Exemple :
 *   php bin/console app:user:promote dev@confluent-digital.com
 *   php bin/console app:user:promote some@user.com user
 */
#[AsCommand(name: 'app:user:promote', description: 'Assigne un rôle (admin par défaut) à un utilisateur identifié par son email.')]
class PromoteUserCommand extends Command
{
    public function __construct(
        private readonly UserRepository $userRepository,
        private readonly EntityManagerInterface $em,
    ) {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addArgument('email', InputArgument::REQUIRED, 'Email de l\'utilisateur à promouvoir')
            ->addArgument('role', InputArgument::OPTIONAL, 'Rôle à assigner (user|admin)', User::ROLE_ADMIN);
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        $email = trim((string) $input->getArgument('email'));
        $role = trim((string) $input->getArgument('role'));

        if ($email === '') {
            $io->error('L\'email est requis.');
            return Command::INVALID;
        }
        if (!in_array($role, User::ROLES, true)) {
            $io->error('Rôle invalide. Valeurs acceptées : ' . implode(', ', User::ROLES));
            return Command::INVALID;
        }

        $user = $this->userRepository->findOneBy(['email' => $email]);
        if (!$user) {
            $io->error('Utilisateur introuvable : ' . $email);
            return Command::FAILURE;
        }

        $previous = $user->getRole();
        if ($previous === $role) {
            $io->success(sprintf('Aucun changement : %s a déjà le rôle %s.', $email, $role));
            return Command::SUCCESS;
        }

        $user->setRole($role);
        $user->setUpdatedAt(new \DateTime());
        $this->em->flush();

        $io->success(sprintf('Rôle de %s : %s → %s.', $email, $previous, $role));
        return Command::SUCCESS;
    }
}
