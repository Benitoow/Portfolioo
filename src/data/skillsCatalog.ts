export interface SkillLink {
  label: string;
  href: string;
}

export interface SkillTool {
  id: string;
  name: string;
  shortName: string;
  logo: string;
  role: string;
  detail: string;
  projects: SkillLink[];
}

export interface SkillCluster {
  id: "ai" | "design" | "video" | "code";
  label: string;
  subtitle: string;
  hubLogo: string;
  accent: string;
  accentRgb: string;
  orbitRing: 0 | 1;
  initialAngle: number;
  tools: SkillTool[];
}

export const SKILLS_CLUSTERS: SkillCluster[] = [
  {
    id: "ai",
    label: "IA & Vibe Coding",
    subtitle: "Prototypage rapide, agents CLI & flux assistés",
    hubLogo: "/images/logos/claude.svg",
    accent: "#F2C94C",
    accentRgb: "242, 201, 76",
    orbitRing: 0,
    initialAngle: -0.65,
    tools: [
      {
        id: "claude",
        name: "Claude",
        shortName: "Claude",
        logo: "/images/logos/claude.svg",
        role: "Architecture & rédaction",
        detail: "Réflexion produit, revue de code, structuration éditoriale et génération d'effets WebGL/SVG.",
        projects: [{ label: "Ce portfolio", href: "/#work" }],
      },
      {
        id: "claudecode",
        name: "Claude Code",
        shortName: "Claude Code",
        logo: "/images/logos/claudecode.svg",
        role: "Agent terminal autonome",
        detail: "Itérations rapides multi-fichiers en ligne de commande, refactoring CSS/JS et scripts de build.",
        projects: [{ label: "Ce portfolio", href: "/#about" }],
      },
      {
        id: "antigravity",
        name: "Antigravity",
        shortName: "Antigravity",
        logo: "/images/logos/antigravity.svg",
        role: "IDE & agents parallèles",
        detail: "Orchestration front/back, contrôle navigateur live, optimisation 60 fps et vérification visuelle.",
        projects: [{ label: "Ce portfolio", href: "/#work" }],
      },
      {
        id: "cursor",
        name: "Cursor",
        shortName: "Cursor",
        logo: "/images/logos/cursor.svg",
        role: "Édition assistée IA",
        detail: "Écriture ciblée de composants React/Astro et retouches contextuelles en temps réel.",
        projects: [{ label: "Aux P'tits Soins Coiffure", href: "/projets/sitecoiffure" }],
      },
      {
        id: "vscode",
        name: "VS Code",
        shortName: "VS Code",
        logo: "/images/logos/vscode.svg",
        role: "Environnement principal",
        detail: "Développement quotidien HTML, CSS, JavaScript, Java, Astro et gestion Git intégrée.",
        projects: [
          { label: "Star Wars", href: "/projets/star-wars" },
          { label: "Coiffure", href: "/projets/sitecoiffure" },
        ],
      },
      {
        id: "gemini",
        name: "Google Gemini",
        shortName: "Gemini",
        logo: "/images/logos/gemini.svg",
        role: "Multimodal & recherche",
        detail: "Analyse visuelle d'interfaces, veille technique et brainstorm sur les directions artistiques.",
        projects: [{ label: "Kaobucha", href: "/projets/kaobucha" }],
      },
      {
        id: "copilot",
        name: "GitHub Copilot",
        shortName: "Copilot",
        logo: "/images/logos/copilot.svg",
        role: "Complétion en flux",
        detail: "Accélération du code répétitif, tests unitaires rapides et documentation propre.",
        projects: [{ label: "GitHub", href: "https://github.com/Benitoow" }],
      },
    ],
  },
  {
    id: "design",
    label: "Création & Design",
    subtitle: "Identités visuelles, maquettes UI & supports imprimés",
    hubLogo: "/images/logos/adobe.svg",
    accent: "#FF9A00",
    accentRgb: "255, 154, 0",
    orbitRing: 0,
    initialAngle: 2.5,
    tools: [
      {
        id: "illustrator",
        name: "Adobe Illustrator",
        shortName: "Illustrator",
        logo: "/images/logos/illustrator.svg",
        role: "Vectoriel & branding",
        detail: "Création de logos sur mesure, chartes graphiques, pictogrammes et déclinaisons print.",
        projects: [
          { label: "Kaobucha", href: "/projets/kaobucha" },
          { label: "Mojo Tunes", href: "/projets/mojo-tunes" },
        ],
      },
      {
        id: "photoshop",
        name: "Adobe Photoshop",
        shortName: "Photoshop",
        logo: "/images/logos/photoshop.svg",
        role: "Retouche, mockups & affiches",
        detail: "Compositions visuelles, détourage, packaging canettes/bouteilles et affiches événementielles.",
        projects: [
          { label: "Kaobucha", href: "/projets/kaobucha" },
          { label: "Fiction sonore", href: "/projets/podcast" },
        ],
      },
      {
        id: "figma",
        name: "Figma",
        shortName: "Figma",
        logo: "/images/logos/figma.svg",
        role: "UI Design & prototypage",
        detail: "Wireframes, design systems, hiérarchie typographique et maquettes desktop/mobile avant intégration.",
        projects: [
          { label: "Mojo Tunes", href: "/projets/mojo-tunes" },
          { label: "Coiffure", href: "/projets/sitecoiffure" },
        ],
      },
      {
        id: "canva",
        name: "Canva Pro",
        shortName: "Canva",
        logo: "/images/logos/canva.svg",
        role: "Déclinaisons sociales",
        detail: "Templates rapides pour campagnes multi-marchés et supports de communication agiles.",
        projects: [{ label: "Kaobucha", href: "/projets/kaobucha" }],
      },
    ],
  },
  {
    id: "video",
    label: "Audiovisuel & Motion",
    subtitle: "Montage rythmé, habillage, étalonnage & 3D",
    hubLogo: "/images/logos/premierepro.svg",
    accent: "#E087C6",
    accentRgb: "224, 135, 198",
    orbitRing: 1,
    initialAngle: 0.9,
    tools: [
      {
        id: "premierepro",
        name: "Adobe Premiere Pro",
        shortName: "Premiere Pro",
        logo: "/images/logos/premierepro.svg",
        role: "Montage & narration",
        detail: "Montage dynamique formats courts/longs, mixage voix/musique et storytelling visuel.",
        projects: [
          { label: "Fiction sonore", href: "/projets/podcast" },
          { label: "TikTok @benitoow", href: "https://www.tiktok.com/@benitoow" },
        ],
      },
      {
        id: "aftereffects",
        name: "Adobe After Effects",
        shortName: "After Effects",
        logo: "/images/logos/aftereffects.svg",
        role: "Motion design & VFX",
        detail: "Animations typographiques, transitions soignées et génériques animés.",
        projects: [{ label: "Astral Covenant", href: "https://www.tiktok.com/@astralcovenant" }],
      },
      {
        id: "davinci",
        name: "DaVinci Resolve",
        shortName: "DaVinci",
        logo: "/images/logos/davinci.svg",
        role: "Étalonnage & finitions",
        detail: "Color grading filmique, harmonies chaudes/forêt et uniformisation de rushs.",
        projects: [{ label: "Boucles vidéo du site", href: "/#hero" }],
      },
      {
        id: "topaz",
        name: "Topaz Video AI",
        shortName: "Topaz AI",
        logo: "/images/logos/topaz.svg",
        role: "Upscaling & netteté IA",
        detail: "Amélioration de piqué, stabilisation et débruitage de séquences vidéo.",
        projects: [{ label: "Vidéos d'ambiance", href: "/#hero" }],
      },
      {
        id: "blender",
        name: "Blender",
        shortName: "Blender",
        logo: "/images/logos/blender.svg",
        role: "Volumes & rendu 3D",
        detail: "Modélisation simple, lumières de studio et mises en scène 3D.",
        projects: [{ label: "Star Wars", href: "/projets/star-wars" }],
      },
    ],
  },
  {
    id: "code",
    label: "Web, Code & Cloud",
    subtitle: "Front-end performant, Astro, Workers & bases solides",
    hubLogo: "/images/logos/astro.svg",
    accent: "#4EC5F1",
    accentRgb: "78, 197, 241",
    orbitRing: 1,
    initialAngle: 4.05,
    tools: [
      {
        id: "html5",
        name: "HTML5",
        shortName: "HTML5",
        logo: "/images/logos/html5.svg",
        role: "Sémantique & accessibilité",
        detail: "Balisage propre, ARIA, données structurées JSON-LD et compatibilité lecteurs d'écran.",
        projects: [
          { label: "Coiffure", href: "/projets/sitecoiffure" },
          { label: "Star Wars", href: "/projets/star-wars" },
        ],
      },
      {
        id: "css3",
        name: "CSS3",
        shortName: "CSS3",
        logo: "/images/logos/css3.svg",
        role: "Mise en page & GPU motion",
        detail: "Design tokens, CSS Grid complexe, responsive mobile et animations fluides à 60 fps.",
        projects: [
          { label: "Coiffure", href: "/projets/sitecoiffure" },
          { label: "Ce portfolio", href: "/#work" },
        ],
      },
      {
        id: "javascript",
        name: "JavaScript",
        shortName: "JavaScript",
        logo: "/images/logos/javascript.svg",
        role: "WebGL, DOM & interactivité",
        detail: "Moteur du compagnon LiveOrb (shader GLSL + atlas), coverflow 3D et micro-interactions.",
        projects: [{ label: "Star Wars", href: "/projets/star-wars" }],
      },
      {
        id: "typescript",
        name: "TypeScript",
        shortName: "TypeScript",
        logo: "/images/logos/typescript.svg",
        role: "Composants sûrs & typés",
        detail: "Données typées, composants React stricts et zéro régression lors des builds Astro.",
        projects: [{ label: "Galaxie Skills 3D", href: "/competences" }],
      },
      {
        id: "astro",
        name: "Astro",
        shortName: "Astro",
        logo: "/images/logos/astro.svg",
        role: "Framework hybride rapide",
        detail: "Pages statiques ultra-légères couplées à des îlots React/Three.js ciblés là où il faut.",
        projects: [{ label: "Ce portfolio", href: "/#about" }],
      },
      {
        id: "cloudflare",
        name: "Cloudflare Workers",
        shortName: "Cloudflare",
        logo: "/images/logos/cloudflare.svg",
        role: "Edge hosting & Markdown",
        detail: "Déploiement statique Edge + Worker HTMLRewriter qui sert du Markdown aux agents IA.",
        projects: [{ label: "llms.txt", href: "/llms.txt" }],
      },
      {
        id: "github",
        name: "GitHub",
        shortName: "GitHub",
        logo: "/images/logos/github.svg",
        role: "Versioning & collaboration",
        detail: "Historique propre, branches et publication continue des dépôts.",
        projects: [{ label: "@Benitoow", href: "https://github.com/Benitoow" }],
      },
      {
        id: "java",
        name: "Java",
        shortName: "Java",
        logo: "/images/logos/java.svg",
        role: "Algorithmique & POO",
        detail: "Deux années complètes de BUT Informatique : conception objet, structures de données et rigueur.",
        projects: [{ label: "Parcours", href: "/#journey" }],
      },
      {
        id: "bash",
        name: "GNU Bash",
        shortName: "Bash",
        logo: "/images/logos/bash.svg",
        role: "Scripts & ligne de commande",
        detail: "Automatisation système, outils CLI et déploiement.",
        projects: [{ label: "À Propos", href: "/#about" }],
      },
    ],
  },
];

export const SOFT_HIGHLIGHTS = [
  {
    title: "Relation client réelle",
    detail: "Site vitrine livré et maintenu depuis 2024 pour un salon de coiffure.",
  },
  {
    title: "Gestion de communauté",
    detail: "Modération & animation sur des serveurs Discord jusqu'à 480 000 membres.",
  },
  {
    title: "Travail d'équipe & SAE",
    detail: "Coordination design + code + audiovisuel en délais courts (BUT Info & MMI).",
  },
  {
    title: "Langues",
    detail: "Français natif · Anglais B2 courant (veille technique & documentation).",
  },
];
