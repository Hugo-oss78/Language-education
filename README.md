# Lingua 🇬🇧 🇪🇸 🇮🇩 🇳🇵 ع

Application web installable (PWA) pour **apprendre et réviser des langues** depuis le français,
avec la **répétition espacée** (on revoit chaque carte juste avant de l’oublier).

- Fonctionne sur téléphone et ordinateur, **hors ligne** une fois ouverte.
- Aucun compte : la progression reste **sur l’appareil** (export / import possible).
- Première langue disponible : **anglais, niveau intermédiaire (B1–B2)**.
  Espagnol, indonésien, népalais et arabe sont prévus.

## Fonctionnalités

| | |
|---|---|
| 📚 Paquets | Faux amis, phrasal verbs, expressions idiomatiques, connecteurs, anglais au travail (≈ 90 cartes) |
| 🔁 Répétition espacée | Variante de SM-2 (l’algorithme d’Anki) avec 4 boutons : À revoir / Difficile / Bien / Facile |
| ↔️ Sens | Français → anglais, anglais → français ou mélangé |
| ⌨️ Mode écriture | Taper sa réponse avant de voir la solution (accents et « to / le / la » tolérés) |
| 🔊 Prononciation | Synthèse vocale du navigateur (la qualité et les voix disponibles dépendent de l’appareil) |
| 📝 Paquets perso | Import CSV : `français ; langue ; exemple ; note` |
| 📈 Statistiques | Série de jours, cartes vues / maîtrisées, activité sur 14 jours |

Raccourcis clavier en révision : **Espace** pour retourner la carte, **1 à 4** pour noter.

## Lancer en local

Les modules JavaScript ne fonctionnent pas en ouvrant simplement le fichier : il faut un petit serveur.

```bash
npm start          # équivaut à : python3 -m http.server 8000
# puis ouvrir http://localhost:8000
npm test           # tests de la logique (Node 20+)
```

## Installer sur téléphone

1. Publier le site (voir ci-dessous) puis l’ouvrir sur le téléphone.
2. **iPhone (Safari)** : Partager → « Sur l’écran d’accueil ».
   **Android (Chrome)** : menu ⋮ → « Installer l’application ».

## Publier avec GitHub Pages

Le workflow `.github/workflows/pages.yml` publie le site à chaque push sur `main`.
Il faut l’activer une fois : dépôt GitHub → **Settings → Pages → Source : GitHub Actions**.

## Ajouter une langue

1. Créer `data/<code>.js` sur le modèle de `data/en.js`.
   Une carte peut avoir un champ `translit` (translittération, utile pour le népalais ou l’arabe).
2. Passer `available: true` dans `data/languages.js` (l’arabe est déjà configuré en écriture de droite à gauche).
3. Ajouter le fichier à la liste `FILES` de `sw.js` et changer `VERSION`.

⚠️ **Qualité du contenu** : faites relire les listes de vocabulaire par un locuteur natif ou
vérifiez-les avec un dictionnaire de référence, surtout pour les langues moins documentées.

## Structure

```
index.html            page unique
css/style.css         styles (thème « carnet de voyage » sombre)
js/app.js             interface et navigation
js/srs.js             algorithme de répétition espacée
js/text.js            comparaison des réponses, lecture CSV
js/storage.js         sauvegarde locale
data/languages.js     langues proposées
data/en.js            paquets d’anglais
fonts/                Fraunces + IBM Plex Sans (licence SIL OFL)
icons/                icône : planète entourée de drapeaux
sw.js                 mode hors ligne
tests/                tests (node --test)
```
