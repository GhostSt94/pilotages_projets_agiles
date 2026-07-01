# Brief de design — Cadence (web)

> Document destiné à **Claude Design** pour générer les maquettes de l'application web Cadence.
> Source de vérité : cahier des charges + modèles du dépôt + skill `cadence-project`.
> Périmètre : **maquettes web uniquement**, aucun code. **Aucune logique d'argent** (pas de
> salaire, pas de facturation, pas de coût) — si une notion financière apparaît, elle est
> hors périmètre.

---

## 1. Contexte produit

Cadence est un outil interne de **Devox** (société de développement, Témara) qui réunit en un
seul produit la **gestion de projets agiles** (projets, sprints, tableau Kanban) et la **gestion
de la disponibilité de l'équipe** (congés, absences, jours travaillés). Sa particularité, à
mettre en avant dans tout le design : **la capacité d'un sprint est calculée à partir des jours
réellement disponibles** des membres (jours travaillés − congés validés) × capacité quotidienne,
puis comparée à la charge planifiée des tâches, avec une **alerte de surcharge**. Cette
fonctionnalité est le cœur du produit : elle ne doit jamais paraître secondaire.

---

## 2. Rôles et ce que chacun voit

| Rôle | Ce qu'il voit / fait |
|---|---|
| **developer** | Tableau Kanban, backlog (lecture), calendrier d'équipe, tableau de bord (lecture), ses propres congés. Met à jour ses tâches assignées (ou celles de ses projets). Déclare ses congés. **Ne voit pas** la validation des congés ni les actions de gestion de sprint. |
| **manager** | Tout ce que voit un developer **+** création/gestion des projets, sprints et backlog, planification selon la capacité (barre de capacité, démarrer/clôturer un sprint), **file de validation des congés** (approuver/refuser), tableau de bord complet. |
| **admin** | Tout ce que voit un manager **+** gestion des comptes et des **paramètres de capacité** (jours travaillés, capacité quotidienne par membre). |

Principe d'affichage : les actions réservées (valider un congé, démarrer un sprint, éditer la
capacité) sont **masquées** (et non simplement désactivées) pour les rôles non autorisés.

---

## 3. Direction artistique

Outil de développement **sobre et focalisé** : neutres froids, un seul accent cobalt, beaucoup de
respiration. Typographie **Inter**. Tous les **chiffres** en `font-variant-numeric: tabular-nums`
(compteurs, estimations, heures, statistiques) pour un alignement net.

### Tokens de couleur
```
--bg:          #F6F7F9   /* canvas / fond d'application */
--surface:     #FFFFFF   /* cartes, panneaux, colonnes */
--surface-2:   #F1F2F5   /* surface secondaire, en-têtes de colonne */
--ink:         #1A1B1E   /* texte principal */
--muted:       #6A6E76   /* texte secondaire */
--faint:       #9AA0A8   /* texte tertiaire, placeholders */
--line:        #E4E6EA   /* bordures, séparateurs */
--accent:      #2D4ECC   /* cobalt — primaire, état actif, focus */
--accent-soft: #E7EAFB   /* fond d'accent doux (sélection, surbrillance) */
```

### Statuts des tâches (colonnes Kanban et badges)
- **À faire** (`todo`) : gris `#7A7F88`
- **En cours** (`in_progress`) : cobalt `#2D4ECC`
- **En revue** (`in_review`) : ambre `#9A6B0C`
- **Terminé** (`done`) : vert `#2C7A50`

### Priorité des tâches (barre verticale à gauche de la carte + badge)
- **Haute** : texte `#C0392F` sur fond `#FBE7E4`
- **Moyenne** : texte `#9A6B0C` sur fond `#F7EDD6`
- **Basse** : texte `#6A6E76` sur fond `#ECEDEF`

### Espacement et formes
- Grille d'espacement en **multiples de 4 px**.
- Rayons de bordure discrets (cartes/panneaux ~8 px), ombres **très légères** ou simples
  bordures `--line`.
- Mise en page **responsive**, composants réutilisables.

### Interdits formels (à respecter strictement)
- Pas de **dégradés violet/indigo**.
- Pas de **glassmorphism** (verre dépoli, transparences floues).
- Pas d'**ombres exagérées**, pas d'effets **glow**.
- Pas de rendu « **IA générique** » (illustrations décoratives, néon, 3D inutile).

### Layout global
Barre latérale de navigation à gauche (Tableau, Backlog, Calendrier, Congés, Tableau de bord) +
zone principale. En-tête de la zone principale : nom du projet/sprint actif, sélecteur de projet
si pertinent, avatar de l'utilisateur courant. La navigation reflète le rôle (le manager voit
« Congés — validation », le developer voit « Mes congés »).

---

## 4. Écrans à concevoir (dans cet ordre)

Pour chaque écran : prévoir systématiquement les **états vide, chargement (skeleton) et erreur**
(message clair + action de réessai), détaillés en section 5.

---

### 4.1 — Connexion

- **Objectif** : authentifier l'utilisateur et obtenir un accès à l'espace de travail.
- **Utilisateur** : tous (non connecté).
- **Contenu et sections** : carte centrée sur le canvas `--bg`. Logo/nom « Cadence » + courte
  accroche (« Pilotage de projets agiles selon la capacité réelle de l'équipe »). Formulaire :
  champ e-mail, champ mot de passe, bouton primaire cobalt « Se connecter ». Pas d'options
  financières, pas de tarif. Lien discret « Mot de passe oublié ? » (non fonctionnel, optionnel).
- **Composants** : carte `--surface`, champs de formulaire avec libellés, bouton primaire,
  zone de message d'erreur sous le formulaire.
- **Données affichées** : aucune donnée métier (écran public).
- **Logique applicative** : à la soumission, appel d'authentification → un jeton est émis et
  l'utilisateur est redirigé vers le **Tableau Kanban** du projet actif. En cas d'identifiants
  invalides, message d'erreur en ligne (« E-mail ou mot de passe incorrect »). Bouton en état
  « chargement » pendant la requête.

---

### 4.2 — Tableau Kanban (sprint actif)

- **Objectif** : visualiser et faire avancer les tâches du **sprint actif** par glisser-déposer.
- **Utilisateur** : tous les membres du projet (developer met à jour ses tâches / celles de ses
  projets ; manager/admin tout).
- **Contenu et sections** :
  - En-tête : nom du projet (**Atlas Retail**), nom du sprint actif (**Sprint 14 — Tunnel d'achat**),
    badge d'état `active`, dates du sprint, petit indicateur de capacité (résumé : « 44 h engagées /
    42 h dispo » en **rouge** si surcharge — lien vers le Backlog/planification).
  - **4 colonnes** : **À faire**, **En cours**, **En revue**, **Terminé**. Chaque colonne a un
    en-tête avec son libellé, sa pastille de couleur de statut et un **compteur** de tâches.
- **Composants** :
  - **TaskCard** : code de tâche (ex. `ATL-142`), titre, **barre de priorité verticale à gauche**
    (couleur priorité), avatar de l'assigné, **estimation en pastille** (ex. `5 h`), étiquettes
    éventuelles. Au survol : poignée de déplacement / curseur de glisser.
  - Colonne : zone de dépôt, état vide par colonne.
  - Badge d'état de sprint, mini-indicateur de capacité.
- **Données affichées** : tâches du sprint actif regroupées par statut, triées par `order` dans
  chaque colonne ; code = `clé projet`-`numéro` (ATL-xxx) ; assigné (avatar + nom au survol) ;
  estimation en heures ; priorité.
- **Logique applicative** :
  - **Glisser-déposer** d'une carte entre colonnes ⇒ **changement de statut**
    (`todo`/`in_progress`/`in_review`/`done`) ; au sein d'une colonne ⇒ **réordonnancement**.
  - La position est **persistée** (`order`) et le statut mis à jour à la pose ; affichage
    optimiste avec retour à l'état précédent en cas d'échec.
  - Un developer ne peut déplacer que ses tâches assignées ou celles de ses projets (les autres
    cartes restent visibles mais non déplaçables).
  - Clic sur une carte : ouvre le **panneau de détail de tâche** (cf. 4.3).
  - Bouton **« + Nouvelle tâche »** dans l'en-tête de colonne ou du board : ouvre le
    **formulaire de tâche** (cf. 4.4).

---

### 4.3 — Détail de tâche & commentaires

- **Objectif** : consulter une tâche dans son intégralité et collaborer via les commentaires.
- **Utilisateur** : tous les membres du projet (édition selon permissions : developer limité à ses
  tâches assignées ou à celles de ses projets).
- **Contenu et sections** : panneau latéral (ou modale) ouvert au clic sur une carte.
  - En-tête : **code** (ex. `ATL-142`) + **titre**, badge de **statut**, badge de **priorité**.
  - Métadonnées : **type** (feature/bug/chore), **assigné** (avatar + nom), **estimation** en
    heures, **étiquettes**, rattachement **sprint ou backlog**.
  - **Description** complète.
  - **Fil de commentaires** : liste chronologique (du plus ancien au plus récent), chaque entrée
    = **auteur** (avatar + nom), **contenu**, **date** (`at`, chiffres tabulaires).
  - Zone de **saisie d'un nouveau commentaire** + bouton « Publier ».
- **Composants** : panneau de détail, badges statut/priorité, avatars, liste de commentaires,
  champ de saisie, actions rapides (changer statut/assigné, **Éditer**, **Supprimer**).
- **Données affichées** : tous les champs de la tâche + ses `comments` **embarqués**
  (`{ author, content, at }`), toujours lus avec la tâche.
- **Logique applicative** :
  - Publier un commentaire l'ajoute au fil (auteur = utilisateur courant, date = maintenant).
  - **Éditer** ouvre le formulaire de tâche (4.4) ; **Supprimer** soumis aux permissions
    (`canModifyTask`).
  - Changement de statut/assigné depuis le panneau reflété immédiatement sur le board.

---

### 4.4 — Création / édition de tâche

- **Objectif** : créer une nouvelle tâche ou modifier une tâche existante. Action la plus
  fréquente du produit.
- **Utilisateur** : tout membre du projet peut **créer** ; un developer ne **modifie/supprime** que
  ses tâches assignées ou celles de ses projets (`canModifyTask`).
- **Contenu et sections** : formulaire (modale ou panneau).
  - **Titre** (`title`) — requis.
  - **Description** (`description`).
  - **Type** : feature / bug / chore.
  - **Priorité** : basse / moyenne / haute (avec les couleurs de priorité du brief).
  - **Estimation** en **heures** (`estimate`) — rappeler l'unité « h », jamais des « points ».
  - **Assigné** (`assignee`) — sélecteur de membre du projet, peut rester vide.
  - **Étiquettes** (`labels`).
  - **Rattachement** : sprint du projet **ou** backlog (`sprint: null`).
  - Boutons **Créer** / **Enregistrer** ; en édition, bouton **Supprimer**.
- **Composants** : champs de formulaire, sélecteurs (type, priorité, membre, sprint), saisie
  d'étiquettes, boutons primaire/secondaire/destructif.
- **Données affichées** : en édition, le formulaire est pré-rempli avec la tâche ; en création,
  valeurs par défaut (statut `todo`, priorité moyenne).
- **Logique applicative** :
  - Le **code de tâche** (ATL-xxx) est **généré automatiquement** à partir de la clé projet — non
    saisi par l'utilisateur.
  - Une tâche ne peut être rattachée qu'à un sprint **de son propre projet**.
  - Validation : titre requis, estimation numérique ≥ 0.
  - À la création depuis le backlog, `sprint` reste `null` ; depuis le board, la tâche est
    rattachée au sprint actif.

---

### 4.5 — Backlog & planification de sprint

- **Objectif** : constituer le contenu d'un sprint et vérifier qu'il **tient dans la capacité**
  disponible de l'équipe.
- **Utilisateur** : **manager/admin** (developer en lecture).
- **Contenu et sections** :
  - **Barre de capacité (CapacityBar)** en haut — **élément signature à soigner** : barre
    horizontale comparant **capacité disponible** vs **charge engagée**, avec valeurs en heures.
    État normal cobalt/vert ; **rouge en cas de surcharge** + libellé « Surcharge : 44 h engagées
    pour 42 h disponibles (−2 h) ». Détail des absences qui réduisent la capacité (ex. « Imane T.
    −2 j, Karim M. −1 j »).
  - **Liste du backlog** : tâches sans sprint (`sprint: null`), une ligne par tâche (code, titre,
    priorité, assigné, estimation). Sélection/ajout au sprint planifié.
  - Bloc « Sprint en préparation » (le sprint `planned`) listant les tâches déjà engagées, avec
    leur estimation cumulée alimentant la charge engagée.
- **Composants** : CapacityBar, liste de tâches (lignes), badges priorité/statut, avatars,
  bouton « Démarrer le sprint » (manager), bouton « Créer un sprint ».
- **Données affichées** :
  - **Capacité disponible** = pour chaque membre, (jours travaillés sur la période du sprint −
    jours de congés **approuvés** chevauchant le sprint) × `dailyCapacityHours`, sommée sur tous
    les membres.
  - **Charge engagée** = somme des `estimate` (heures) des tâches rattachées au sprint.
  - **Marge** = disponible − engagé ; booléen **surcharge** si engagé > disponible.
  - Détail des absences (membre, nombre de jours).
- **Logique applicative** :
  - Déplacer une tâche du backlog vers le sprint planifié **augmente la charge engagée** et met à
    jour la barre en temps réel.
  - Seuls les congés **`approved`** réduisent la capacité (un congé `pending` ne compte pas).
  - La surcharge est une **alerte visuelle** (n'empêche pas l'action mais doit être bien visible).
  - « Démarrer le sprint » fait passer le sprint `planned → active` (réservé manager/admin) ;
    rappel : **un seul sprint actif par projet**.

---

### 4.6 — Calendrier d'équipe

- **Objectif** : visualiser la disponibilité de l'équipe jour par jour.
- **Utilisateur** : tous (manager/admin pour le pilotage).
- **Contenu et sections** : grille **membres (lignes) × jours (colonnes)** sur une période
  (semaine ou mois, avec navigation période précédente/suivante). Cellules colorées selon
  l'état : **présent**, **congé**, **maladie**. Légende des états. Week-ends / jours non
  travaillés visuellement atténués.
- **Composants** : en-têtes de jours (date + jour de semaine), lignes membre (avatar + nom),
  cellules d'état, légende, sélecteur de période.
- **Données affichées** : membres du projet/équipe ; pour chaque jour, l'état dérivé des congés
  (`conge` / `maladie` / `autre`) **approuvés** et des jours travaillés (`workingDays`). Les jours
  hors `workingDays` apparaissent comme non travaillés.
- **Logique applicative** : un congé `approved` qui couvre un jour marque la cellule en
  congé/maladie ; survol d'une cellule = détail (type, motif). Pas d'action de validation ici
  (cf. écran Congés). Cohérence directe avec le calcul de capacité du sprint.

---

### 4.7 — Déclaration de congé

- **Objectif** : permettre à un utilisateur de **déposer** une demande d'absence. Point de départ
  du cycle de vie du congé (`pending → approved / rejected`).
- **Utilisateur** : tout utilisateur (pour lui-même) ; manager/admin peuvent déclarer **pour
  autrui**.
- **Contenu et sections** : formulaire (modale ou page) + liste **« Mes congés »**.
  - **Type** : congé / maladie / autre.
  - **Date de début** et **date de fin** (sélecteur de dates).
  - **Nombre de jours** dérivé et affiché automatiquement.
  - **Motif** (`reason`, texte libre).
  - Pour manager/admin : champ **« pour quel membre »**.
  - Bouton **Envoyer la demande**.
  - **Mes congés** : liste de ses propres demandes avec leur statut (badge `pending` ambre,
    `approved` vert, `rejected` gris/rouge), période et type.
- **Composants** : champs de formulaire, sélecteur de dates, sélecteur de membre (manager/admin),
  liste de demandes avec badges de statut.
- **Données affichées** : congés de l'utilisateur courant ; statut et qui a validé (`reviewedBy`)
  pour les demandes traitées.
- **Logique applicative** :
  - L'envoi crée un congé au statut **`pending`** (n'impacte **pas encore** la capacité).
  - Validation : date de fin ≥ date de début.
  - La demande apparaît ensuite dans la file de validation du manager (4.8).

---

### 4.8 — Validation des congés (manager)

- **Objectif** : traiter les demandes de congés en attente.
- **Utilisateur** : **manager/admin** (un developer voit seulement « Mes congés » : liste de ses
  propres demandes avec leur statut, sans actions de validation).
- **Contenu et sections** :
  - **File des demandes en attente** (`pending`) : liste/tableau avec demandeur (avatar + nom),
    type (congé / maladie / autre), dates (du … au …), nombre de jours, motif.
  - Filtres par statut (en attente / approuvées / refusées) et compteur d'éléments en attente.
- **Composants** : lignes de demande, badges de type et de statut (`pending` ambre, `approved`
  vert, `rejected` gris/rouge), boutons d'action **Approuver** / **Refuser**, avatars.
- **Données affichées** : congés filtrés par statut ; pour chaque demande : utilisateur, type,
  période, motif, et (si traité) qui a validé.
- **Logique applicative** :
  - **Approuver** ⇒ statut `pending → approved` ; la demande disparaît de la file et **réduit la
    capacité** des sprints chevauchant la période (impact visible dans Backlog/planification et
    Tableau de bord).
  - **Refuser** ⇒ statut `pending → rejected` (sans impact sur la capacité).
  - Confirmation discrète après action ; ligne en état « traitement » pendant la requête.

---

### 4.9 — Tableau de bord

- **Objectif** : donner au manager une vue synthétique de l'avancement et de la charge du sprint.
- **Utilisateur** : **manager/admin** (developer en lecture).
- **Contenu et sections** :
  - **Indicateurs (cartes chiffres)** : **avancement du sprint** (% de tâches terminées),
    **points/heures faits sur total** (ex. « 28 h / 56 h »), **disponibles du jour** (nombre de
    membres présents aujourd'hui).
  - **Tâches par statut** : barres ou répartition (À faire / En cours / En revue / Terminé) avec
    compteurs et couleurs de statut.
  - **Charge par membre** : barres horizontales, une par membre, montrant heures assignées vs
    capacité disponible du membre ; **surcharge en rouge** si un membre dépasse sa capacité.
- **Composants** : cartes d'indicateur (chiffre + libellé, chiffres tabulaires), graphiques
  à barres (statuts), barres horizontales (charge par membre), avatars, badges de statut.
- **Données affichées** : avancement et compteurs dérivés des tâches du sprint actif ;
  disponibilité du jour dérivée du calendrier ; charge/capacité par membre issue du même calcul
  de capacité que le Backlog (réutiliser la logique, ne pas la dupliquer).
- **Logique applicative** : tout est calculé pour le **sprint sélectionné** (par défaut le sprint
  actif) ; les chiffres reflètent en temps réel l'état des tâches et les congés approuvés.

---

### 4.10 — Admin · Équipe & capacité

- **Objectif** : gérer les comptes et **régler les paramètres qui pilotent le calcul de capacité**.
  C'est l'**entrée** de la fonctionnalité signature : sans ces réglages, la CapacityBar et l'alerte
  de surcharge n'ont pas de valeurs d'origine.
- **Utilisateur** : **admin** uniquement.
- **Contenu et sections** :
  - **Liste des membres** : nom, e-mail, **rôle** (developer / manager / admin).
  - Édition par membre :
    - **`dailyCapacityHours`** — capacité par jour travaillé (ex. 7 h, 8 h).
    - **`workingDays`** — jours travaillés, cases lun→dim (entiers `0`=dimanche … `6`=samedi,
      défaut lun–ven `[1,2,3,4,5]`).
    - **rôle** — promotion developer → manager/admin (réservée à l'admin).
  - Création et désactivation de compte.
- **Composants** : tableau de membres, champ numérique (capacité), sélecteur de jours (cases à
  cocher), sélecteur de rôle, badges de rôle, boutons d'action.
- **Données affichées** : les utilisateurs et leurs paramètres de capacité (jamais le mot de
  passe).
- **Logique applicative** :
  - Modifier `dailyCapacityHours` ou `workingDays` **recalcule la capacité disponible** des
    sprints concernés (effet visible dans le Backlog 4.5 et le Tableau de bord 4.9).
  - **Aucune notion d'argent** : on ne gère que des heures et des jours (pas de coût horaire ni de
    salaire).

---

## 5. Règles et états transverses

### Règles métier à refléter dans le design
- **Cycle de vie du sprint** : `planned → active → completed`. Représenter l'état par un badge ;
  les actions « Démarrer » / « Clôturer » sont réservées à manager/admin.
- **Un seul sprint `active` par projet** à la fois : l'interface ne propose pas de démarrer un
  second sprint tant qu'un sprint est actif.
- **Backlog = tâche sans sprint** (`sprint: null`).
- **Capacité** : seuls les congés **`approved`** réduisent la capacité ; calcul sur la période du
  sprint, jours travaillés selon `workingDays`, dédoublonnage des jours.
- **Permissions par rôle** : masquer (pas seulement désactiver) les actions non autorisées.
- **Unité = heures** partout (estimations et capacité). Aucune notion d'argent.

### États à prévoir pour **chaque** écran
- **Vide** : message neutre + éventuelle action.
  - Kanban : « Aucune tâche dans cette colonne. »
  - Détail de tâche : « Aucun commentaire pour le moment. »
  - Backlog : « Le backlog est vide — ajoutez des tâches. »
  - Calendrier : « Aucun membre / aucune absence sur la période. »
  - Déclaration de congé : « Aucune demande déclarée. »
  - Validation des congés : « Aucune demande en attente. »
  - Tableau de bord : « Aucun sprint actif — démarrez un sprint pour voir les indicateurs. »
  - Admin · Équipe : « Aucun membre — créez un compte. »
- **Chargement** : squelettes (skeletons) reproduisant la structure (colonnes, lignes, cartes,
  barres) plutôt qu'un simple spinner.
- **Erreur** : encart clair avec message lisible et bouton **Réessayer** ; ne jamais afficher de
  données en dur trompeuses.

---

## 6. Contenu réaliste pour les maquettes

Utiliser ces données concrètes (cohérentes entre tous les écrans).

- **Projet** : **Atlas Retail** (clé **ATL**), statut `active`.
- **Sprint actif** : **Sprint 14 — « Tunnel d'achat »**, du **22 juin 2026** au **3 juillet 2026**
  (2 semaines), statut `active`.
- **Sprint en préparation** : **Sprint 15 — « Recherche & filtres »**, statut `planned`.

### Membres de l'équipe
| Nom | Rôle | Capacité/jour | Jours travaillés |
|---|---|---|---|
| **Reda B.** | manager | 7 h | lun–ven |
| **Salma A.** | developer | 7 h | lun–ven |
| **Youssef K.** | developer | 8 h | lun–ven |
| **Imane T.** | developer | 7 h | lun–jeu |
| **Karim M.** | developer | 7 h | lun–ven |

### Exemple de tâches (Sprint 14)
| Code | Titre | Type | Priorité | Estimation | Assigné | Statut |
|---|---|---|---|---|---|---|
| ATL-142 | Page de paiement — récapitulatif commande | feature | Haute | 8 h | Salma A. | En cours |
| ATL-143 | Validation du formulaire d'adresse | feature | Moyenne | 5 h | Youssef K. | À faire |
| ATL-138 | Correction du calcul des quantités au panier | bug | Haute | 3 h | Karim M. | En revue |
| ATL-145 | Composant « étapes de commande » | feature | Moyenne | 5 h | Imane T. | En cours |
| ATL-150 | Mise à jour des libellés de confirmation | chore | Basse | 2 h | Salma A. | Terminé |
| ATL-151 | États de chargement du tunnel | feature | Moyenne | 4 h | Youssef K. | À faire |
| ATL-129 | Tests e2e du parcours d'achat | chore | Basse | 6 h | Karim M. | En revue |
| ATL-155 | Message d'erreur paiement refusé | bug | Haute | 3 h | Imane T. | À faire |

### Exemple de backlog (Sprint 15 / non planifié)
| Code | Titre | Type | Priorité | Estimation |
|---|---|---|---|---|
| ATL-160 | Barre de recherche produits | feature | Haute | 8 h |
| ATL-161 | Filtres par catégorie | feature | Moyenne | 6 h |
| ATL-162 | Tri par pertinence / prix | feature | Moyenne | 5 h |
| ATL-163 | Pagination des résultats | chore | Basse | 4 h |

### Exemple de congés
| Membre | Type | Période | Statut |
|---|---|---|---|
| Imane T. | congé | 25–26 juin 2026 | approved |
| Karim M. | congé | 1 juillet 2026 | approved |
| Salma A. | maladie | 30 juin 2026 | pending |
| Youssef K. | congé | 7–11 juillet 2026 | pending |

### Exemple de calcul de capacité (Sprint 14, à afficher dans la CapacityBar)
- **Capacité disponible** ≈ **42 h** (jours travaillés des 5 membres sur la période, moins les
  congés approuvés d'Imane T. −2 j et Karim M. −1 j).
- **Charge engagée** = somme des estimations des tâches du sprint = **44 h**.
- **Résultat : surcharge de −2 h** ⇒ barre **rouge**, libellé d'alerte, détail des absences.

Ces chiffres servent d'illustration cohérente : la maquette doit montrer clairement l'état de
**surcharge** comme cas d'usage central du produit.
