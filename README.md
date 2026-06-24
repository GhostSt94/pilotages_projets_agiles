# Cadence — API Back-end

Back-end de **Cadence**, application d'organisation agile (stage Devox, Témara).
Elle combine la gestion de projets / sprints / tâches (Kanban) avec la gestion de
la **disponibilité de l'équipe** (congés, jours travaillés). Sa particularité : la
**capacité d'un sprint** est calculée à partir des jours réellement disponibles des
membres (jours travaillés − congés approuvés) puis comparée à la charge des tâches
planifiées, avec une **alerte de surcharge**.

> Périmètre : **back-end uniquement** (API REST). Le front React et l'app mobile Expo
> consommeront cette API plus tard.

## Stack

- **Node.js + Express** — API REST
- **MongoDB + Mongoose** — base documentaire
- **JWT** (jsonwebtoken) + **bcrypt** (bcryptjs) — authentification, mots de passe hachés
- **express-validator** — validation des entrées
- **CORS** activé pour les clients web/mobile

## Prérequis

- Node.js ≥ 18
- Une base MongoDB : instance locale (`mongodb://127.0.0.1:27017`) **ou** un cluster
  MongoDB Atlas (offre gratuite).

## Installation

```bash
npm install
cp .env.example .env   # puis ajustez les valeurs (Windows : copy .env.example .env)
```

Variables d'environnement (`.env`) :

| Variable         | Description                                  | Exemple                                |
| ---------------- | -------------------------------------------- | -------------------------------------- |
| `PORT`           | Port d'écoute de l'API                       | `4000`                                 |
| `MONGODB_URI`    | Chaîne de connexion MongoDB                  | `mongodb://127.0.0.1:27017/cadence`    |
| `JWT_SECRET`     | Secret de signature des jetons JWT           | `une-chaine-longue-et-aleatoire`       |
| `JWT_EXPIRES_IN` | Durée de validité des jetons                 | `7d`                                   |
| `CORS_ORIGIN`    | Origine(s) autorisée(s), `*` pour tout       | `http://localhost:5173`                |

## Lancer le serveur

```bash
npm run dev     # développement (nodemon, rechargement auto)
npm start       # production
```

Au démarrage, le serveur se connecte à MongoDB puis expose l'API sur
`http://localhost:4000`. Sonde de santé : `GET /health`.

## Initialiser des données (seed)

```bash
npm run seed
```

> ⚠️ Le seed **vide** les collections puis recrée un jeu de données de démonstration :
> 3 développeurs + 1 manager + 1 admin, le projet **Atlas Retail**, un **sprint actif**,
> des tâches à différents statuts (+ backlog) et quelques congés.

Comptes créés (mot de passe commun : `password123`) :

| Email              | Rôle      | Capacité/j | Jours travaillés |
| ------------------ | --------- | ---------- | ---------------- |
| `admin@devox.ma`   | admin     | 6 h        | lun→ven          |
| `manager@devox.ma` | manager   | 5 h        | lun→ven          |
| `dev1@devox.ma`    | developer | 6 h        | lun→ven          |
| `dev2@devox.ma`    | developer | 7 h        | lun→ven          |
| `dev3@devox.ma`    | developer | 6 h        | lun→jeu (4 j)    |

Le seed affiche en fin d'exécution les **identifiants du projet et des sprints**, et les
URLs prêtes à tester pour la capacité et le dashboard.

## Tester quelques requêtes

> Remplacez `<TOKEN>`, `<SPRINT_ID>`, `<PROJECT_ID>` par les valeurs réelles
> (le seed affiche les IDs des sprints/projet).

1. **Connexion** → récupérer un jeton JWT :

```bash
curl -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"manager@devox.ma","password":"password123"}'
```

2. **Profil courant** :

```bash
curl http://localhost:4000/users/me -H "Authorization: Bearer <TOKEN>"
```

3. **Capacité d'un sprint** (le point central) :

```bash
curl http://localhost:4000/sprints/<SPRINT_ID>/capacity \
  -H "Authorization: Bearer <TOKEN>"
```

Réponse (extrait) — capacité disponible vs charge engagée, alerte de surcharge et détail
des absences par membre :

```json
{
  "unit": "hours",
  "availableCapacityHours": 270,
  "committedHours": 48,
  "remainingHours": 222,
  "utilizationRate": 18,
  "overload": false,
  "members": [
    { "user": { "name": "Sara Salhi" }, "availableDays": 8, "leaveDays": 2, "availableHours": 56, "absences": [ ... ] }
  ]
}
```

4. **Tableau Kanban du sprint actif** :

```bash
curl http://localhost:4000/projects/<PROJECT_ID>/board -H "Authorization: Bearer <TOKEN>"
```

5. **Backlog** (tâches sans sprint) :

```bash
curl "http://localhost:4000/tasks?project=<PROJECT_ID>&sprint=null" -H "Authorization: Bearer <TOKEN>"
```

6. **Dashboard d'avancement** :

```bash
curl "http://localhost:4000/dashboard?sprint=<SPRINT_ID>" -H "Authorization: Bearer <TOKEN>"
```

## Points d'accès de l'API

| Méthode | Endpoint                          | Rôle requis     | Description                                   |
| ------- | --------------------------------- | --------------- | --------------------------------------------- |
| POST    | `/auth/register`                  | public          | Inscription (crée un `developer`)             |
| POST    | `/auth/login`                     | public          | Connexion, renvoie un JWT                     |
| GET     | `/users/me`                       | authentifié     | Profil courant                               |
| GET     | `/users`                          | manager/admin   | Liste des utilisateurs (pour gérer les membres)|
| PATCH   | `/users/:id`                      | admin           | Capacité, jours travaillés, rôle              |
| GET     | `/projects`                       | authentifié     | Projets (filtrés pour le developer)           |
| POST    | `/projects`                       | manager/admin   | Créer un projet                               |
| GET     | `/projects/:id`                   | membre          | Détail d'un projet                            |
| PATCH   | `/projects/:id`                   | manager/admin   | Modifier (dont statut actif/archivé)          |
| DELETE  | `/projects/:id`                   | manager/admin   | Supprimer (+ sprints & tâches)                |
| POST    | `/projects/:id/members`           | manager/admin   | Ajouter un membre                             |
| DELETE  | `/projects/:id/members/:userId`   | manager/admin   | Retirer un membre                             |
| GET     | `/projects/:id/board`             | membre          | Kanban du sprint actif (groupé par statut)    |
| GET     | `/projects/:id/sprints`           | authentifié     | Sprints d'un projet                           |
| POST    | `/sprints`                        | manager/admin   | Créer un sprint                               |
| GET     | `/sprints/:id`                    | authentifié     | Détail d'un sprint                            |
| PATCH   | `/sprints/:id`                    | manager/admin   | Modifier (dates, objectif…)                   |
| PATCH   | `/sprints/:id/start`              | manager/admin   | Démarrer (planned → active)                   |
| PATCH   | `/sprints/:id/complete`           | manager/admin   | Clôturer (active → completed)                 |
| GET     | `/sprints/:id/capacity`           | authentifié     | **Capacité disponible vs charge**             |
| GET     | `/tasks?project=&sprint=`         | authentifié     | Lister (sprint=null ⇒ backlog)                |
| POST    | `/tasks`                          | membre du projet| Créer une tâche                               |
| GET     | `/tasks/:id`                      | authentifié     | Détail d'une tâche                            |
| PATCH   | `/tasks/:id`                      | membre/assigné  | Modifier une tâche                            |
| PATCH   | `/tasks/:id/move`                 | membre/assigné  | Déplacer (statut / sprint / ordre)            |
| POST    | `/tasks/:id/comments`             | membre/assigné  | Ajouter un commentaire                        |
| DELETE  | `/tasks/:id`                      | membre/assigné  | Supprimer une tâche                           |
| POST    | `/leaves`                         | authentifié     | Déclarer un congé                             |
| GET     | `/leaves`                         | authentifié     | Lister (siens, ou tous pour manager/admin)    |
| PATCH   | `/leaves/:id/approve`             | manager/admin   | Valider un congé                              |
| PATCH   | `/leaves/:id/reject`              | manager/admin   | Refuser un congé                              |
| GET     | `/dashboard?sprint=`              | authentifié     | Avancement + charge par membre                |

## Logique de capacité

Pour un sprint sur sa période `[startDate, endDate]` :

1. Pour chaque membre du projet : on compte ses **jours travaillés** sur la période
   (selon `workingDays`), on retranche les **jours couverts par ses congés approuvés**
   qui chevauchent le sprint → **jours disponibles**, puis × `dailyCapacityHours` →
   **capacité du membre** (en heures).
2. Somme sur les membres → **capacité disponible du sprint**.
3. Somme des `estimate` des tâches rattachées au sprint → **charge engagée**.
4. Réponse : capacité disponible, charge engagée, **indicateur de surcharge** si
   l'engagé dépasse le disponible, et le **détail des absences** par membre.

> Unité unique : **heures** (cohérence entre `task.estimate` et `dailyCapacityHours`).
> `workingDays` est un tableau d'entiers `0`=dimanche … `6`=samedi (cf. `Date#getUTCDay`).

## Structure du projet

```
config/        connexion MongoDB et variables d'environnement
models/        schémas Mongoose (un fichier par modèle)
controllers/   logique des endpoints
routes/        définition des routes + validation (express-validator)
middlewares/   auth JWT, contrôle de rôle, validation, gestion d'erreurs
services/      logique métier de capacité
utils/         helpers (asyncHandler, ApiError, authz)
seed/          script d'initialisation des données
app.js         configuration Express (CORS, routes, erreurs)
server.js      démarrage (connexion DB + écoute HTTP)
```

## Tests

Aucun framework de test n'est encore configuré. La vérification se fait via le seed +
les requêtes `curl`/Postman ci-dessus. (Piste : Jest + supertest + mongodb-memory-server.)
