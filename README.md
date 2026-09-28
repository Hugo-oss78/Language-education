# Lingua

Application web installable (PWA) pour **apprendre des langues depuis le français** :
anglais, espagnol, indonésien, népalais et arabe.

- Fonctionne sur téléphone et ordinateur, **hors ligne** une fois ouverte.
- Aucun compte : la progression reste **sur l’appareil** (export / import possible).
- **834 cartes** (mots, lettres, phrases) en 51 paquets et **15 dialogues**, du niveau A1 au B2 (niveaux indicatifs).

| Langue | Paquets | Cartes | Remarque |
|---|---|---|---|
| Anglais | 11 | 188 | B1–B2 : conversation, collocations, faux amis, phrasal verbs, nuances, phrases |
| Espagnol | 10 | 165 | A1–B2, variantes d’Amérique latine signalées |
| Indonésien | 9 | 156 | A1–B1, grammaire en phrases |
| Népalais | 11 | 174 | Alphabet devanagari + A1–B1, translittération · **à faire relire** |
| Arabe | 10 | 151 | Alphabet + arabe standard (fuṣḥā), de droite à gauche · **à faire relire** |

Chaque langue a aussi 3 **dialogues** (audio, traduction, questions de compréhension)
et un paquet **« Construire des phrases »** avec sa fiche de grammaire.

## Parcours

Chaque langue a un **parcours** en unités courtes : l’alphabet (népalais, arabe), puis A1 → B2.
Une unité regroupe 2 ou 3 thèmes et se termine par un **dialogue** qui sert d’étape de validation.
Un thème est validé quand chaque carte a été réussie au moins une fois ; un dialogue, avec au moins 2 bonnes réponses sur 3.
L’étape suivante est mise en avant, mais toutes restent ouvertes ; chaque unité a son quiz.

## Exercices

La séance du jour mélange révisions et nouveaux mots. Chaque mot suit une **difficulté progressive** :

1. **Découverte** : le mot, sa traduction, une phrase d’exemple traduite, l’audio.
2. **Reconnaître** : QCM dans les deux sens (intrus pris dans le même thème).
3. **En contexte** : phrase à trous, en QCM puis à écrire.
4. **Produire** : écrire la traduction (petites fautes de frappe tolérées, translittération acceptée pour le népalais et l’arabe), comprendre à l’oral.

Les **phrases** se remettent dans l’ordre, s’écrivent et se **répètent à voix haute** (« À toi de le dire »).
Les **lettres** (népalais, arabe) : reconnaître la lettre, la retrouver, écrire son son.
La **reconnaissance vocale** est facultative et désactivée par défaut : selon le navigateur,
l’audio peut être envoyé au service de Google ou d’Apple. Sans elle, on s’auto-évalue.

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
   `translit`, `example`, `exampleTr`, `exampleFr`, `note`. Un paquet `type: 'script'` (lettres, champ `key`)
   ou `type: 'sentences'` (phrases, avec `tips`) change les exercices proposés. Les dialogues vont dans `dialogues`.
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
js/path.js            découpage du parcours en unités et étapes
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
