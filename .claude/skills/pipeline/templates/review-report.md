# Rapport de review — PR #`<numéro>`

## Verdict
**VALIDÉ** ✅ (aucun 🔴 ni 🟠) — ou — **REJETÉ** ❌

## Scope reviewé
- Fichiers : <git diff --name-only main...HEAD>
- `php bin/console doctrine:schema:validate` (si backend touché) : ✅ / ❌
- `npm run build` (si frontend touché) : ✅ / ❌
- Diff clés i18n fr↔en : ✅ / ❌ (si frontend touché)

## 🔴 Critiques
*(rejet immédiat — un seul suffit)*

- aucune

ou :

### `<fichier>:<ligne>` — `<règle violée>`
- **Pattern trouvé** : `<citation ≤ 120 chars>`
- **Correction attendue** : <référence à `.claude/rules/<rule>.md` ou `backend/.claude/rules/<rule>.md` ou `frontend/.claude/rules/<rule>.md` ou `.claude/skills/<skill>/SKILL.md`>

## 🟠 Majeurs
*(rejet — un seul suffit)*

- aucune

ou : (même format que ci-dessus)

## 🟡 Mineurs
*(non bloquants mais à noter)*

- aucune

## Notes positives
*(optionnel — mentions rapides de ce qui est bien aligné)*

- <ex : ownership Doctrine respecté sur la nouvelle route>
- <ex : 2 fichiers locales cohérents pour les nouvelles clés>
- <ex : `PendingMailQueue::enqueue` utilisé proprement — pas de MailerInterface direct>
- <ex : matcher du `proxy.js` mis à jour pour la nouvelle page>

---

Rapport produit par l'agent `fullstack-code-reviewer` (`.claude/agents/fullstack-code-reviewer.md`).
