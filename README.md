# Lingua

Application web installable (PWA) pour **apprendre des langues depuis le français** :
anglais, espagnol, indonésien, népalais et arabe.

- Fonctionne sur téléphone et ordinateur, **hors ligne** une fois ouverte.
- Aucun compte : la progression reste **sur l’appareil** (export / import possible).
- **688 cartes** réparties en 41 paquets, du niveau A1 au B2 (niveaux indicatifs).

| Langue | Paquets | Cartes | Remarque |
|---|---|---|---|
| Anglais | 10 | 173 | B1–B2 : conversation, collocations, faux amis, phrasal verbs, nuances… |
| Espagnol | 9 | 151 | A1–B2, variantes d’Amérique latine signalées |
| Indonésien | 8 | 142 | A1–B1, dont un paquet de grammaire en phrases |
| Népalais | 7 | 111 | A1–B1, devanagari + translittération · **à faire relire** |
| Arabe | 7 | 111 | Arabe standard (fuṣḥā), écriture de droite à gauche + translittération · **à faire relire** |

## Exercices

La séance du jour mélange révisions et nouveaux mots. Chaque mot suit une **difficulté progressive** :

1. **Découverte** : le mot, sa traduction, une phrase d’exemple traduite, l’audio.
2. **Reconnaître** : QCM dans les deux sens (intrus pris dans le même thème).
3. **En contexte** : phrase à trous, en QCM puis à écrire.
4. **Produire** : écrire la traduction (petites fautes de frappe tolérées, translittération acceptée pour le népalais et l’arabe), comprendre à l’oral.

Aussi : **Quiz éclair** (10 questions de tous types), mode **Cartes seules** (auto-évaluation), indices, « J’avais raison » pour faire accepter un synonyme.

## La méthode

L’onglet « Méthode » de l’application l’explique en détail, avec les sources :

- **Se tester** plutôt que relire (effet de test : Roediger & Karpicke, 2006).
- **Espacer** les révisions (Cepeda et al., 2006) : variante de SM-2, l’algorithme d’Anki.
- Ces deux techniques sont jugées les plus utiles par la revue de Dunlosky et al. (2013).
- **Mélanger** les thèmes, **du contexte** partout, **correction immédiate**.

Lingua construit le vocabulaire et les automatismes ; pour parler couramment, il faut le compléter par de vraies conversations.

## Statistiques

Série de jours, mots vus et maîtrisés, taux de réussite sur 30 jours, activité sur 14 jours,
prévision des révisions sur 7 jours, progression par langue.

## Lancer en local

Les modules JavaScript ne fonctionnent pas en ouvrant simplement le fichier : il faut un petit serveur.

```bash
npm start          # équivaut à : python3 -m http.server 8000
# puis ouvrir http://localhost:8000
npm test           # tests (Node 20+)
```

## Installer sur téléphone

1. Publier le site (voir ci-dessous), puis l’ouvrir sur le téléphone.
2. **iPhone (Safari)** : Partager → « Sur l’écran d’accueil ».
   **Android (Chrome)** : menu ⋮ → « Installer l’application ».

L’audio utilise les voix installées sur l’appareil : l’onglet Réglages indique lesquelles sont disponibles.
Sans voix pour une langue, les exercices d’écoute sont simplement désactivés pour celle-ci.

## Publier avec GitHub Pages

Le workflow `.github/workflows/pages.yml` lance les tests puis publie le site à chaque push sur `main`
(à activer une fois : **Settings → Pages → Source : GitHub Actions**).

## Ajouter une langue ou des mots

1. Créer `data/<code>.js` sur le modèle des autres fichiers. Paquet : `id`, `title`, `icon`
   (voir `js/icons.js`), `hue`, `level`, `description`, `cards`. Carte : `fr`, `term`, et en option
   `translit`, `example`, `exampleTr`, `exampleFr`, `note`.
2. L’ajouter dans `data/languages.js` et dans la liste `FILES` de `sw.js` (et changer `VERSION`).
3. `npm test` vérifie le contenu (champs, doublons, icônes, niveaux).

On peut aussi créer ses propres paquets depuis l’application (import CSV).

⚠️ **Qualité du contenu** : les listes de népalais et d’arabe doivent être relues par un locuteur natif.

## Structure

```
index.html            page unique
css/style.css         styles (thème sombre, verre, lueurs)
js/app.js             interface, séances, statistiques
js/exercises.js       choix et construction des exercices
js/srs.js             répétition espacée
js/text.js            correction des réponses, lecture CSV
js/storage.js         sauvegarde locale
js/icons.js           icônes et drapeaux (SVG)
data/                 langues et paquets
fonts/                Fraunces + IBM Plex Sans (licence SIL OFL)
icons/                icône de l’application
sw.js                 mode hors ligne
tests/                tests (node --test)
```
