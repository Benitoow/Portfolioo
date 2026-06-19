# Benjamin LELEU — Portfolio

Portfolio personnel hébergé sur [benjaminleleu.fr](https://benjaminleleu.fr), construit en HTML/CSS/JS vanilla.

## Stack

- HTML5 sémantique / CSS custom properties / JS ES2020
- GSAP 3 + ScrollTrigger (page d'accueil)
- AOS.js 2.3 (pages projets)
- Fonts : Playfair Display, DM Sans, Space Mono (Google Fonts)
- Hébergement : Cloudflare Pages

## Palette

| Token | Valeur | Usage |
|---|---|---|
| `--bg` | `#1E1B18` | Fond principal |
| `--accent` | `#F2C94C` | Kodak Yellow — CTA, titres actifs |
| `--text` | `#D6CFC7` | Texte courant |

## Structure

```
├── index.html              # Page d'accueil
├── projets/                # 10 pages projets
│   ├── kaobucha.html
│   ├── mojo-tunes.html
│   ├── star-wars.html
│   ├── podcast.html
│   ├── SiteWebCapCom.html
│   ├── SiteVentePC.html
│   ├── hypnotherapie.html
│   ├── AIAimbot.html
│   ├── CoCBot.html
│   └── sitecoiffure.html
├── css/
│   └── projet-pages.css    # Styles partagés des pages projets
├── js/
│   └── main.js             # GSAP animations, vidéos, nav
├── images/
│   ├── posters/            # Thumbnails WebP pour les vidéos
│   └── og-image.png        # Open Graph 1200x630
├── videos/                 # 5 videos foret en boucle (12 s, ~8 Mo total)
├── docs/projets/           # PDF de rendus
├── audios/projets/         # Fichiers audio
├── cv/                     # CV PDF téléchargeable
├── sitemap.xml
├── robots.txt
├── llms.txt                # Machine-readable pour agents IA
└── _headers                # Headers Cloudflare Pages
```

## Déploiement

Push sur `main` → Cloudflare Pages déploie automatiquement.
