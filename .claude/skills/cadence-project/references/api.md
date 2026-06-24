# API et logique métier

## Points d'accès

| Méthode | Endpoint | Rôle | Description |
|---|---|---|---|
| POST | `/auth/register` · `/auth/login` | Public | Inscription / connexion (renvoie un JWT) |
| GET | `/users/me` | Authentifié | Profil courant |
| GET / PATCH | `/users` · `/users/:id` | Admin | Comptes, capacité, jours travaillés |
| GET / POST | `/projects` | Manager/Admin | Lister / créer des projets |
| GET | `/projects/:id/board` | Membre | Tâches du sprint actif regroupées par statut |
| POST | `/sprints` | Manager | Créer un sprint |
| GET | `/projects/:id/sprints` | Membre | Sprints d'un projet |
| PATCH | `/sprints/:id/start` · `/complete` | Manager | Démarrer / clôturer (un seul actif par projet) |
| GET | `/tasks?project=&sprint=` | Membre | Lister (backlog = `sprint` null) |
| POST / PATCH / DELETE | `/tasks` · `/tasks/:id` | Membre | CRUD tâche |
| PATCH | `/tasks/:id/move` | Membre | Changer statut / sprint / ordre |
| POST / GET | `/leaves` | Membre | Déclarer / lister les congés |
| PATCH | `/leaves/:id/approve` · `/reject` | Manager | Valider / refuser |
| GET | `/sprints/:id/capacity` | Manager | **Capacité disponible vs charge engagée** |
| GET | `/dashboard?sprint=` | Manager | Avancement et charge par membre |

## Logique de capacité — `GET /sprints/:id/capacity`

C'est le cœur du produit. Pour le sprint donné, sur sa période `[startDate, endDate]` :

1. Pour **chaque membre** du projet :
   - Compter ses **jours travaillés** sur la période (jours dont le numéro de semaine est dans `workingDays`).
   - Retrancher les jours couverts par ses **congés approuvés** qui chevauchent le sprint → **jours disponibles**.
   - `capacité du membre = jours disponibles × dailyCapacityHours`.
2. **Capacité disponible du sprint** = somme des capacités des membres.
3. **Charge engagée** = somme des `estimate` des tâches rattachées au sprint.
4. Renvoyer : capacité disponible, charge engagée, marge (disponible − engagé), un booléen
   `overcommitted` (engagé > disponible), et le **détail des absences** (membre, jours).

Réponse type :
```json
{
  "availableHours": 42,
  "committedHours": 44,
  "overcommitted": true,
  "absences": [{ "user": "Imane T.", "days": 2 }, { "user": "Karim M.", "days": 1 }]
}
```

Ne compter que les congés au statut `approved`. Un congé `pending` ne réduit pas encore la capacité.

## Règles métier à respecter

- Seuls manager/admin créent projets et sprints, et démarrent/clôturent un sprint.
- Un seul sprint `active` par projet à la fois.
- Un développeur ne modifie que ses tâches assignées ou celles de ses projets.
- Un congé est validé par le manager ; un congé `approved` réduit la capacité sur la période.
- Cycle de vie du sprint : `planned → active → completed`.
- Une tâche `sprint: null` est dans le backlog.
