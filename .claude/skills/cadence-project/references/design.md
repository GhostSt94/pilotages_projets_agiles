# Design du front (web)

Direction : outil de dev sobre et focalisé, neutres froids et accent cobalt. Éviter absolument
les dégradés violet/indigo, le glassmorphism, les ombres exagérées et les effets « glow ».
Typographie : **Inter**. Chiffres en `font-variant-numeric: tabular-nums`.

## Tokens de couleur
```
--bg:        #F6F7F9   /* canvas */
--surface:   #FFFFFF
--surface-2: #F1F2F5
--ink:       #1A1B1E   /* texte principal */
--muted:     #6A6E76
--faint:     #9AA0A8
--line:      #E4E6EA
--accent:    #2D4ECC   /* cobalt — actions, état actif, primaire */
--accent-soft:#E7EAFB
```

## Couleurs de statut des tâches (colonnes Kanban)
- À faire (`todo`) : gris `#7A7F88`
- En cours (`in_progress`) : cobalt `#2D4ECC`
- En revue (`in_review`) : ambre `#9A6B0C`
- Terminé (`done`) : vert `#2C7A50`

## Priorité
- Haute : `#C0392F` (fond `#FBE7E4`)
- Moyenne : `#9A6B0C` (fond `#F7EDD6`)
- Basse : `#6A6E76` (fond `#ECEDEF`)

## Composants clés
- **Layout** : barre latérale de navigation à gauche + zone principale (Tableau, Backlog, Calendrier, Congés, Tableau de bord).
- **TaskCard** : code de la tâche (ex. ATL-142), titre, barre de priorité à gauche, avatar de l'assigné, estimation en pastille, étiquettes.
- **Tableau Kanban** : 4 colonnes, en-tête avec compteur, glisser-déposer, persistance de l'ordre.
- **CapacityBar** : barre montrant la capacité disponible vs engagée ; **rouge** en cas de surcharge, avec le détail des absences. Élément signature à soigner.
- **StatusBadge** : pastille colorée selon le statut.
- **Calendrier d'équipe** : lignes = membres, colonnes = jours ; cellules présent / congé / maladie.
- **Tableau de bord** : indicateurs (avancement, points faits/total, disponibles), tâches par statut (barres), charge par membre (barres horizontales).

Garder une mise en page responsive, des espacements cohérents (multiples de 4 px) et des
composants réutilisables sans logique d'API.
