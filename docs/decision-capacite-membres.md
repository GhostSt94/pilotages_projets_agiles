# Note de décision — Quels membres comptent dans la capacité d'un sprint ?

**Statut : à trancher** (idéalement avec l'encadrant de stage)
**Concerne :** [services/capacityService.js](../services/capacityService.js), `GET /sprints/:id/capacity`, `GET /dashboard`

---

## Le problème

Le cahier des charges dit : « la capacité d'un sprint est la somme des capacités
disponibles des **membres affectés** ». Aujourd'hui, le calcul somme **tous les membres
du projet** (`project.members`), qu'ils travaillent ou non sur ce sprint précis.

Conséquence : un membre du projet qui ne prend aucune tâche du sprint gonfle quand même
la capacité disponible → on peut **masquer une surcharge réelle**.

---

## Chiffrage sur les données du seed (sprint actif « Atlas Retail »)

Membres du projet et capacité disponible sur la période (jours travaillés − congés) :

| Membre            | A des tâches dans le sprint ? | Heures dispo |
| ----------------- | :---------------------------: | -----------: |
| Mounia Manager    | ❌ (aucune)                    | 50 h |
| Driss Développeur | ✅                            | 60 h |
| Sara Salhi        | ✅ (−2 j congé)               | 56 h |
| Yassine Younsi    | ✅ (semaine 4 j)              | 48 h |

Charge engagée (somme des estimations des tâches du sprint) : **48 h**.

| Mode de calcul                         | Capacité dispo | Occupation | Surcharge ? |
| -------------------------------------- | -------------: | ---------: | :---------: |
| **A — tous les membres (actuel)**      | **214 h**      | 22 %       | non |
| **B — membres affectés au sprint**     | **164 h**      | 29 %       | non |

Même conclusion ici (pas de surcharge), mais l'écart est de **50 h (≈ 23 %)** : sur un
sprint plus chargé, le mode A pourrait afficher « OK » alors que le mode B alerterait.

---

## Les options

### Option A — Tous les membres du projet *(comportement actuel)*
- ✔️ Simple, déjà implémenté, aucun changement de modèle.
- ✔️ Reflète « la capacité théorique de l'équipe projet ».
- ❌ S'éloigne du libellé « membres affectés » du CDC ; peut sous-estimer la charge réelle.

### Option B1 — Membres ayant ≥ 1 tâche assignée dans le sprint
- ✔️ Colle au CDC, **aucun nouveau champ** : on déduit l'affectation des tâches.
- ✔️ Capacité = celle des gens qui bossent réellement sur le sprint.
- ❌ Effet de bord : une tâche **non assignée** (assignee = null) ne compte personne ;
  un membre dont on retire la dernière tâche sort du calcul (capacité « saute »).
- ❌ Capacité qui bouge au fil de l'assignation (peut surprendre l'utilisateur).

### Option B2 — Liste explicite de membres du sprint *(nouveau champ `Sprint.members`)*
- ✔️ La plus fidèle au CDC ; le manager choisit qui est « dans » le sprint.
- ✔️ Capacité stable et prévisible, indépendante de l'assignation des tâches.
- ❌ Coût : champ `members` sur le modèle Sprint, UI de sélection, endpoint de mise à
  jour, et seed à adapter.

---

## Recommandation

Pour le **MVP / la soutenance** : **garder l'option A**, mais l'**assumer explicitement**
dans l'UI — afficher sous le panneau capacité une mention du type « Capacité calculée sur
tous les membres du projet » — et le mentionner dans le rapport comme choix de
modélisation.

**Évolution recommandée (post-MVP)** : passer à **B2** (membres du sprint explicites),
qui est la lecture la plus rigoureuse du besoin et donne une capacité stable. B1 est un
intermédiaire « gratuit » mais au comportement moins intuitif.

> Décision rapide possible : si l'encadrant veut coller au CDC dès maintenant sans
> alourdir le modèle, **B1** est faisable en ~30 min (filtrer les membres sur ceux qui
> ont une tâche dans le sprint, dans `computeSprintCapacity`). B2 est un petit chantier
> (modèle + UI).

---

## Impact technique selon l'option retenue

| Option | Fichiers à toucher | Charge |
| ------ | ------------------ | ------ |
| A | aucun (statu quo) + libellé UI | ~0 |
| B1 | `services/capacityService.js` (filtrer les membres via les tâches du sprint) | faible |
| B2 | `models/Sprint.js` (champ `members`), `sprintController` (set members), `capacityService.js`, seed, UI sprint | moyen |

*Dans tous les cas, la règle « seuls les congés `approved` chevauchant le sprint
réduisent la capacité » reste inchangée.*
