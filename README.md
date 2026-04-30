1. Lancer le docker
    ```bash
    docker compose up -d
    ```
2. Lancer le frontend
    ```bash
    cd frontend && npm run dev
    ```
3. Lancer le backend
    ```bash
    cd backend && symfony server:start
    ```
4. Accéder à l'application
    - Frontend : http://localhost:3000
    - Backend : http://localhost:8000

5. Vérifier que vous avez tous les .env nécessaires pour le backend et le frontend. Vous pouvez les trouver dans les fichiers `.env` respectifs.

6. Activer l'envoi de mails : 

    ```bash
      symfony console messenger:consume async
    ```