# Mode Enfant : audit, architecture et plan

Ce document répond aux 10 points demandés avant l’implémentation. Il décrit aussi ce que contient le MVP (phase 3).

## 1. Architecture actuelle

- **PWA sans framework** : HTML, CSS et JavaScript en modules ES. Pas de build ni de dépendance au moment de l’exécution.
- **Pas de serveur ni de compte** : tout est stocké dans le `localStorage` de l’appareil (clé `lingua.v1`). Le site est publié sur GitHub Pages.
- **Hors ligne** grâce au service worker `sw.js` : réseau d’abord, cache en secours, liste `FILES` et `VERSION`.
- **Routeur par hash** (`#/vue/a/b`) dans `js/app.js`. Ce fichier contient toutes les vues adultes : accueil, langue, parcours, séance, dialogue, stats, méthode, réglages.
- **Modules purs et testés** :
  - `srs.js` : SM-2 ;
  - `exercises.js` ;
  - `path.js` ;
  - `text.js` ;
  - `lookup.js`.
- **Audio** : synthèse vocale du navigateur (Web Speech API). La reconnaissance vocale est facultative et désactivée par défaut, car l’audio peut partir chez Google ou Apple.
- **Tests** : `node --test` (Node 22 en CI), puis déploiement si les tests passent.

## 2. Fichiers modifiés

| Fichier | Changement |
|---|---|
| `js/app.js` | Import du verrou enfant, route `#/kids/…` (le module est chargé seulement quand on y va), carte « Mode Enfant » sur l’accueil |
| `index.html` | Feuille `css/kids.css` |
| `sw.js` | Nouveaux fichiers, `VERSION` → `lingua-v10` |
| `README.md` | Section Mode Enfant |

Aucune fonctionnalité adulte n’a été supprimée ou modifiée.

## 3. Fichiers créés

| Fichier | Rôle |
|---|---|
| `data/kids/en.js` | 20 mots (niveau 1), 6 catégories, 5 missions, phrases modèles |
| `js/kids/engine.js` | Moteur **pur** : construction de séance, 7 scores par mot, répétition espacée enfant, adaptation, conseils, résumé de la semaine |
| `js/kids/store.js` | Stockage séparé (`lingua.kids.v1`), profils, suppression complète, verrou |
| `js/kids/ui.js` | Écrans : création du profil, espace parent, accueil enfant, séance, porte parentale |
| `css/kids.css` | Styles isolés (préfixe `kid-`) |
| `tests/kids.test.js` | 13 tests (données, séance, scores, stabilité, profils, hors ligne) |

## 4. Modèle de données

Toutes ces données sont stockées dans `localStorage['lingua.kids.v1']`.

```js
{
  profiles: [{
    id, name,           // prénom ou surnom, 30 caractères max
    avatar,             // emoji choisi (pas de photo)
    birth: 'AAAA-MM',   // facultatif, sert à adapter la difficulté
    native: 'fr', target: 'en',
    interests: ['toys', 'animals', …],
    sessionMinutes: 2–7,
    createdAt
  }],
  activeId,
  locked,               // true pendant le mode enfant
  progress: { [profilId]: { [motId]: {
    comp, recog, prod, pron, stab, gen, spont,   // 0–100, indépendants
    step, nextReview, lastSeen, lastSuccessDay, seen, successes, introduced
  } } },
  missions: { [profilId]: { [missionId]: { done, last } } },
  history:  { [profilId]: [{ at, duration, words, missionsDone }] },  // 300 séances max
  stickers: { [profilId]: [emoji] }                                   // le « petit monde »
}
```

**Données minimales.** Le profil ne contient ni nom de famille, ni date de naissance complète, ni photo, ni voix.

**Format d’un mot.** `{ id, word, fr, category, tier, emoji: [principale, variantes…], a, the, person?, more? }`.

## 5. Architecture du Mode Enfant

```
app.js (routeur) ──► #/kids/…  ──► import('./kids/ui.js') ──► routeKids()
      │                                   │
      └─ si verrouillé : tout renvoie     ├─ engine.js (pur, testé)
         vers #/kids/play                 ├─ store.js (stockage séparé)
                                          └─ data/kids/en.js
```

### Écrans

| Adresse | Écran | Accès |
|---|---|---|
| `#/kids` | Espace parent | Bloqué en mode enfant |
| `#/kids/new`, `#/kids/edit` | Profil | Bloqué en mode enfant |
| `#/kids/play` | Accueil enfant | Toujours |
| `#/kids/session` | Séance | Toujours |

### Séance

Une séance de 2 à 7 minutes suit cet ordre :

1. Rituel : « Hello Tim! ».
2. Réactivation : les mots à revoir.
3. Découverte : 1 à 3 nouveaux mots. Le contexte vient d’abord (« Look! A ball! »), puis le mot seul.
4. Compréhension : « Where is the ball? », avec 2 images au début et jusqu’à 4 quand le mot est stable (3 au plus avant 3 ans).
5. Action : toucher l’image trois fois en comptant.
6. Production facultative : « What’s this? ». Le parent indique ce que l’enfant a dit (mot, presque, essai, rien). L’app redonne toujours le modèle.
7. Généralisation : le même mot sous une autre image.
8. Mission dans la vraie vie.
9. Conclusion : un autocollant pour le petit monde.

### Pas de correction négative

Après une erreur, l’app ne dit pas « non ». Elle dit « That’s the banana. Here’s the ball! » et le bon choix brille.

Si l’enfant ne répond pas, il n’y a pas de compte à rebours visible. Après 8 s la question est redite. Après encore 7 s, la réponse est montrée.

### Adaptation et stabilité

- La compréhension monte avec les réussites et ne baisse jamais à cause d’une erreur.
- Les paliers de révision sont de 10 min, puis 1, 3, 7, 14 et 30 jours. Le palier n’augmente qu’**une fois par jour** : cinq réussites le même jour ne suffisent pas.
- Un mot est **acquis** quand trois conditions sont réunies : compréhension ≥ 60, stabilité ≥ 40 (réussites sur 3 jours différents) et généralisation ≥ 20.
- Il n’y a pas de nouveau mot si 4 mots récents sont encore fragiles, et 1 seul s’il y en a 2.

### Sortie protégée

1. Appui long de 2 s sur « Parent ».
2. Une addition (par exemple 7 + 5), avec 4 réponses au choix.

Le verrou survit au rechargement de la page.

## 6. Dépendances

Il n’y a **aucune nouvelle dépendance**. Le Mode Enfant utilise uniquement :

- la synthèse vocale du navigateur (anglais britannique, plus lente et un peu plus aiguë) ;
- les emoji du système comme images.

## 7. Coûts des API

**MVP : 0 €.** Le Mode Enfant n’appelle aucun service en ligne.

Pour la V1, les options et leur coût :

| Besoin | Option | Coût |
|---|---|---|
| Reconnaissance vocale | Web Speech API du navigateur | Gratuite, mais l’audio peut être envoyé à Google ou Apple selon le navigateur ; à activer seulement avec un accord parental explicite |
| Reconnaissance vocale | Service payant (Google, Azure, AWS…) | Facturé à la minute audio ; tarifs **à vérifier** sur les pages officielles avant de choisir (je n’avance pas de chiffre) |
| Reconnaissance vocale | Modèle embarqué (ex. Whisper en WebAssembly) | Gratuit et l’audio reste sur l’appareil, mais le modèle est lourd (dizaines de Mo) et plus lent sur un vieux téléphone ; précision sur des voix d’enfants de 2 ans **non vérifiée** |
| Images | Illustrations sur mesure | Coût d’un illustrateur ou d’une banque d’images sous licence |
| Voix | Voix enregistrée par un locuteur natif | Coût de l’enregistrement, mais meilleure qualité que la synthèse |

## 8. Risques techniques

| Risque | Ce qui est fait |
|---|---|
| Pas de voix anglaise sur l’appareil, ou synthèse muette | Le texte reste affiché en grand pour que le parent puisse lire, et un minuteur de secours fait avancer la séance |
| iOS exige un geste avant la première parole | La séance démarre toujours par un appui (bouton ▶) |
| Les emoji changent selon l’appareil, et papa ou maman ne ressemblent pas aux vrais parents | Les missions dans la vraie vie servent justement à faire le lien ; les photos des parents (« Mon Monde ») sont prévues en V1 |
| La reconnaissance vocale comprend mal les enfants de 2 à 3 ans (prononciation en construction) | MVP : c’est le parent qui juge ; V1 : la reconnaissance restera optionnelle et ne pénalisera jamais l’enfant |
| L’enfant sort de l’app (geste retour Android, rechargement) | Le verrou est enregistré et toute adresse le ramène au mode enfant ; le bouton d’accueil du téléphone reste hors de portée d’une PWA |
| Le `localStorage` est effacé (navigation privée, nettoyage du navigateur) | Comme le mode adulte ; un export des données enfant est prévu en V1 |
| Régression du mode adulte | Code isolé, chargé à la demande ; tests adultes inchangés et vérification Playwright des pages adultes |

## 9. Plan par étapes

| Phase | Contenu | Statut |
|---|---|---|
| 1. Audit | Ce document | ✅ |
| 2. Architecture | Module isolé, modèle de données, moteur pur | ✅ |
| 3. MVP | Profil, mode enfant verrouillé, 20 mots, 5 missions, audio, interactions tactiles, 7 scores, répétition espacée, espace parent minimal, suppression du profil | ✅ (cette version) |
| 4. V1 | Voir la liste ci-dessous | À faire |
| 5. Tests | Test réel avec Tim (scénario ci-dessous), ajustements de durée et de difficulté, relecture par un professionnel de la petite enfance si possible | À faire |

La V1 comprendra :

- **Contenu** : les 200 mots (3 paliers), les 20 structures de phrases, les 50 missions et des mini-histoires.
- **« Mon Monde »** : photos du parent, gardées sur l’appareil, avec consentement explicite ; jamais utilisées pour entraîner un modèle.
- **Reconnaissance vocale** : optionnelle.
- **Suivi** : rapport hebdomadaire détaillé, export et import des données enfant.
- **Progression** : de 2 à 5 ans.

## 10. Complexité estimée

L’échelle est indicative : S = quelques heures, M = 1 à 2 jours, L = plusieurs jours.

| Étape | Complexité |
|---|---|
| Profil et stockage séparé | S |
| Moteur de séance et scores | M |
| Écrans enfant (séance, aides, animations) | M |
| Porte parentale et verrou | S |
| Espace parent minimal | S |
| 200 mots, 20 structures et 50 missions (contenu et relecture) | L : surtout du travail de contenu |
| « Mon Monde » (photos locales, consentement) | M |
| Reconnaissance vocale enfant fiable | L : risque élevé, résultat incertain |
| Rapport hebdomadaire complet | S à M |
| Test réel et ajustements | M, sur plusieurs semaines d’usage |

## Premier test avec Tim

Le scénario vérifié automatiquement dans le navigateur, avec une voix simulée :

1. « Hello Tim! »
2. « Look! A ball! »
3. « Where is the ball? » : une erreur volontaire donne « That’s the banana. Here’s the ball! », puis « Yes! Ball! ».
4. « Touch the ball! » : « One! Two! Three! Great! »
5. « Look! Another ball! Where is the ball? » : « Yes! Ball! »
6. « Can you find your ball? » : mission faite.
7. « Great! Bye bye, Tim! »

En conditions réelles, compter **2 à 4 minutes** selon le rythme de l’enfant.

### Ce qu’il faut observer avec Tim

- Est-ce qu’il touche les images de lui-même ?
- Les images sont-elles assez grandes ?
- La voix est-elle assez lente ?
- Est-ce qu’il reste jusqu’au bout ?
- Le parent comprend-il les boutons ?

## Ce que l’app ne fait pas

Lingua n’évalue pas le développement du langage, l’audition ou les apprentissages. L’espace parent le dit clairement et renvoie vers un professionnel de santé en cas de question.
