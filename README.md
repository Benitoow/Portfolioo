# Benjamin LELEU — Portfolio

Portfolio personnel hébergé sur [benjaminleleu.fr](https://benjaminleleu.fr), construit en HTML/CSS/JS vanilla.

## Stack

- HTML5 sémantique / CSS custom properties / JS ES2020, sans build
- GSAP 3 + ScrollTrigger, servi localement (`js/vendor/`)
- WebGL maison (`js/shader.js`) : reflets de lumière discrets, accueil et fiches
- Icônes : sprites SVG locaux — Hugeicons et Line MD pour les fiches (`images/project-icons.svg`, licences MIT dans `images/licenses/`), Heroicons 2.2 pour les compétences de l’accueil
- Fonts : Playfair Display, DM Sans, Space Mono, auto-hébergées en woff2 (`fonts/`)
- Logo : revient à l’accueil et y lance les ballons de `balloons-js` (MIT), embarqué dans `js/vendor/` et chargé au premier clic seulement ; mouvement réduit et économie de données respectés
- Surface agent : `worker/index.js` renvoie la page en markdown quand la requête porte `Accept: text/markdown` (HTML par défaut, `Vary: Accept`), et `llms.txt` résume le site pour les agents
- Hébergement : Cloudflare Workers avec assets statiques

Aucune ressource n'est chargée depuis un domaine tiers : les polices, GSAP et les
icônes viennent du site, ce qui supprime quatre origines du chemin critique et
laisse `_headers` piloter leur cache (polices un an, CSS/JS 30 jours).

## Palette

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#1E1B18` | Fond principal |
| `--accent` | `#F2C94C` | Kodak Yellow — CTA, titres actifs |
| `--text` | `#D6CFC7` | Texte courant |

## Structure

```
├── index.html              # Accueil : hero, à propos, coverflow, compétences, parcours, contact
├── 404.html
├── projets/                # 5 fiches projet
│   ├── kaobucha.html
│   ├── mojo-tunes.html
│   ├── star-wars.html
│   ├── podcast.html
│   └── sitecoiffure.html
├── css/
│   ├── tokens.css          # Tokens + styles partagés, chargé par toutes les pages
│   ├── style.css           # Accueil
│   ├── coverflow.css       # Galerie des projets
│   └── projet-pages.css    # Fiches projet
├── worker/
│   └── index.js            # Worker : sert les assets + négociation markdown
├── js/
│   ├── shared.js           # Commun : curseur, défilement, barre de progression, année
│   ├── projet-pages.js     # Fiches : agrandissement des visuels, repli audio
│   ├── main.js             # Accueil : GSAP, vidéos de fond, menu mobile
│   ├── coverflow.js        # Galerie des projets (clavier, molette, glisser)
│   ├── shader.js           # Calque lumineux WebGL
│   └── vendor/             # GSAP 3.12.5 + ScrollTrigger + balloons-js (MIT), servis localement
├── fonts/                  # woff2 auto-hébergés (sous-ensemble latin)
├── images/
│   ├── posters/            # Affiches des vidéos de fond (1024x576)
│   ├── thumbs/             # Vignettes du coverflow
│   ├── projets/            # Visuels des fiches
│   ├── icons.svg           # Sprite d'icônes de l'accueil
│   ├── project-icons.svg   # Hugeicons et Line MD pour les fiches
│   ├── licenses/           # Notices MIT des icônes
│   └── og-image.jpg        # Open Graph 1200x630
├── videos/                 # 4 boucles forêt (12 s) pour le fond de l'accueil
├── Projet/Perso/           # Captures du site client (coiffure)
├── docs/projets/           # PDF de rendus
├── audios/projets/         # Fichiers audio
├── cv/                     # CV PDF téléchargeable
├── sitemap.xml
├── robots.txt
├── llms.txt                # Machine-readable pour agents IA
└── _headers                # Headers Cloudflare Pages
```

## Déploiement

Le site est un **Worker Cloudflare avec assets statiques** (projet `portfolioo`),
et non un projet Cloudflare Pages : c'est la section `[assets]` de
`wrangler.toml` qui définit ce qui est publié, avec `worker/index.js` comme
point d'entrée.

```
npx wrangler deploy        # publie le Worker et ses assets statiques
```

Un `git push` **ne déploie pas** : GitHub Pages construit bien une copie du
dépôt (`benitoow.github.io/Portfolioo`), mais le domaine benjaminleleu.fr pointe
sur le Worker. Pour publier : `npx wrangler login` une fois, puis
`npx wrangler deploy` à chaque fois (le Worker et les assets partent ensemble,
et le déploiement est atomique : en cas d'échec, l'ancienne version reste en
ligne).

## Aperçu local

Les cinq fiches reprennent la palette et les polices de l’accueil. Leurs collages,
galeries et cartes de fichiers sont en HTML/CSS, sans dépendance supplémentaire.
Les images s’agrandissent dans un dialogue accessible (Échap pour fermer) ; sans
JavaScript, les liens ouvrent directement les images. Les PDF restent accessibles
par un lien et un aperçu dépliable des deux premières pages, servi en images pour
fonctionner aussi sur mobile ; la fiction sonore utilise le lecteur natif.
Le dialogue suspend le curseur personnalisé et restaure le pointeur natif ; le
curseur personnalisé reprend au prochain mouvement après la fermeture.

```
npx wrangler dev       # http://127.0.0.1:8787
```

C'est l'environnement le plus fidèle : il exécute `worker/index.js`, applique
`_headers` (cache, sécurité) et résout les URL sans extension, comme la
production. `python -m http.server` suffit pour regarder une page, mais il
ignore `_headers` (un audit Lighthouse lancé dessus signalera à tort des durées
de cache trop courtes) et ne sait pas résoudre `/projets/kaobucha` sans
l'extension : les liens internes y renvoient 404.

Cache en production : HTML revalidé à chaque visite, CSS/JS/images 30 jours avec
`stale-while-revalidate`, vidéos et polices un an en `immutable`. Un média
remplacé **sous le même nom** reste donc servi depuis le cache du navigateur
jusqu'à expiration : changer le nom du fichier, ou purger le cache Cloudflare.
