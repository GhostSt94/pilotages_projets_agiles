# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Contexte

Back-end de **Cadence**, application d'organisation agile (projet de stage chez Devox,
Témara). Elle combine la gestion de projets / sprints / tâches sur un tableau Kanban
avec la gestion de la disponibilité de l'équipe (congés, jours travaillés). La
spécificité du produit : la **capacité d'un sprint** est dérivée des jours réellement
disponibles des membres (jours travaillés − congés approuvés) et comparée à la charge
des tâches planifiées, avec une **alerte de surcharge**. Le cahier des charges complet
est dans `spec/cdc_cadence.docx`.

Périmètre actuel : **back-end uniquement**. Un front React puis une app mobile Expo
consommeront cette API.

## Stack

Node.js + Express · MongoDB + Mongoose · JWT (jsonwebtoken) + bcrypt (`bcryptjs`) ·
express-validator · CORS. CommonJS (`require`), pas d'ESM.

## Commandes

```bash
npm install        # installer les dépendances
npm run dev        # démarrer en dev (nodemon)
npm start          # démarrer en production
npm run seed       # (ré)initialiser la base avec des données de démo
```

Pas encore de lint ni de tests configurés. Vérification manuelle via le seed + curl
(voir README). Pour tester un endpoint isolé : récupérer un JWT via `POST /auth/login`
(comptes du seed, mot de passe `password123`), puis appeler l'endpoint avec l'en-tête
`Authorization: Bearer <token>`.

## Architecture (vue d'ensemble)

Pipeline d'une requête : `server.js` (connexion DB + écoute) → `app.js` (CORS, JSON,
routes, 404, errorHandler) → `routes/*` (validation express-validator + middlewares de
rôle) → `controllers/*` → `services/` ou `models/` directement.

Conventions transversales **à respecter** :

- **Erreurs** : ne jamais renvoyer manuellement un statut d'erreur. Lever
  `ApiError.notFound(...)`, `.forbidden(...)`, `.badRequest(...)`, etc.
  (`utils/ApiError.js`). Tous les contrôleurs sont enrobés dans `asyncHandler`
  (`utils/asyncHandler.js`) qui propage les rejets vers `middlewares/errorHandler.js`.
  Ce dernier traduit aussi les erreurs Mongoose (ValidationError, CastError, doublon
  `11000`) en réponses propres.
- **Validation** : chaque route définit ses règles `body()/param()/query()` puis le
  middleware `validate` (`middlewares/validate.js`). Les contrôleurs supposent les
  entrées déjà validées.
- **Auth & rôles** : `authenticate` (`middlewares/auth.js`) charge `req.user` depuis le
  JWT. `requireRole('manager', 'admin')` (`middlewares/role.js`) garde les routes
  réservées. La logique d'autorisation métier fine est dans `utils/authz.js`
  (`isManagerOrAdmin`, `isProjectMember`, `canModifyTask`).
- **Modèles** : un fichier par modèle dans `models/`, ré-exportés par `models/index.js`.
  Importer via `const { User, Task } = require('../models')`. Les enums sont exposés en
  statics (`Task.STATUSES`, `Sprint.STATUSES`, `Leave.STATUSES`…).

## Règles métier (invariants à préserver)

- **Unité = heures partout.** `task.estimate` et `user.dailyCapacityHours` sont en
  heures ; ne pas mélanger avec des "points". Tout le calcul de capacité en dépend.
- **`workingDays`** : tableau d'entiers `0`=dimanche … `6`=samedi (aligné sur
  `Date#getUTCDay`). Défaut `[1,2,3,4,5]`.
- **Tâche** : `sprint: null` ⇒ la tâche est dans le **backlog**. Une tâche ne peut être
  rattachée qu'à un sprint **de son propre projet** (vérifié par
  `assertSprintBelongsToProject`).
- **Cycle de vie d'un sprint** : `planned → active → completed`. **Un seul sprint
  `active` par projet** à la fois (vérifié au `start`). Seuls manager/admin créent,
  démarrent et clôturent les sprints.
- **Projets / sprints** : création et gestion réservées à manager/admin. Le créateur
  d'un projet en est automatiquement membre et `manager`.
- **Tâches** : tout membre du projet peut créer ; un developer ne modifie/supprime que
  ses tâches assignées **ou** celles de ses projets (`canModifyTask`).
- **Congés** : déclarés par tout utilisateur (pour lui-même ; manager/admin peuvent pour
  autrui), validés/refusés par manager/admin. Un congé **`approved`** chevauchant un
  sprint **réduit** la capacité disponible sur la période.
- **Inscription** (`/auth/register`) crée toujours un rôle `developer`. La promotion en
  manager/admin passe par `PATCH /users/:id` (admin) ou le seed — ne pas autoriser un
  rôle arbitraire à l'inscription.

## Le calcul de capacité (`services/capacityService.js`)

C'est le cœur métier et le point le plus sensible. `computeSprintCapacity(sprintId)` :

1. Charge le sprint, son projet et les membres peuplés.
2. Énumère les jours du sprint **en UTC** (`eachDay`, `toUtcMidnight`) — éviter les
   bornes locales pour ne pas introduire de décalage de fuseau.
3. Par membre : ensemble des jours ouvrés (selon `workingDays`), moins les jours de
   congés `approved` chevauchant le sprint, **dédoublonnés via un `Set` de clés
   `YYYY-MM-DD`** (deux congés qui se chevauchent ne comptent pas double). Puis
   `availableDays × dailyCapacityHours`.
4. Somme → `availableCapacityHours` ; somme des `estimate` des tâches du sprint →
   `committedHours` ; `overload = committedHours > availableCapacityHours`.

`dashboardController` réutilise ce service pour le taux d'occupation par membre — ne pas
dupliquer la logique de capacité ailleurs.

## Configuration

Variables via `.env` (modèle dans `.env.example`), lues et centralisées dans
`config/env.js` : `PORT`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `CORS_ORIGIN`.
Ne pas lire `process.env` ailleurs que dans `config/env.js`.
