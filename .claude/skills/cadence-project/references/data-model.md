# Modèle de données (MongoDB / Mongoose)

Cinq collections. Les commentaires et étiquettes sont **embarqués** dans la tâche ; le reste est référencé.

## users
Comptes, rôles et paramètres de capacité.
- `name`, `email` (unique), `passwordHash` (`select: false`)
- `role` : `developer` | `manager` | `admin`
- `dailyCapacityHours` (ex. 7) — capacité par jour travaillé
- `workingDays` : tableau d'entiers (1 = lundi … 5 = vendredi)
- `team` (optionnel)

## projects
- `name`, `key` (ex. « ATL »), `description`
- `members` : références vers `users`
- `status` : `active` | `archived`

## sprints
- `project` (ref), `name`, `goal`
- `startDate`, `endDate`
- `status` : `planned` | `active` | `completed`
- Index : `{ project, status }`

## tasks
- `project` (ref), `sprint` (ref | `null` ; `null` = backlog)
- `title`, `description`, `type` (`feature` | `bug` | `chore`)
- `estimate` (en heures pour le MVP), `priority` (`low` | `medium` | `high`)
- `status` : `todo` | `in_progress` | `in_review` | `done`
- `assignee` (ref | null)
- `labels` : tableau de chaînes (embarqué)
- `comments` : tableau embarqué `{ author (ref), content, at }`
- `order` : position dans la colonne / le backlog
- Index : `{ project, sprint, status, order }`, `{ assignee }`

## leaves
Congés et absences.
- `user` (ref), `type` (`conge` | `maladie` | `autre`)
- `startDate`, `endDate`
- `status` : `pending` | `approved` | `rejected`
- `reason`, `reviewedBy` (ref)
- Index : `{ user, startDate }`, `{ status }`

## Choix de modélisation
- Embarqué (dans la tâche) : `comments`, `labels` — bornés et toujours lus avec la tâche.
- Référencé : tout le reste (croissance et requêtes séparées).
- Une tâche au backlog a `sprint: null`.
