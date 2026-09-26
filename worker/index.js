/**
 * Worker du site : statique (assets) + négociation markdown.
 *
 * Un client qui demande `Accept: text/markdown` reçoit la page convertie ;
 * tout le reste (navigateurs, robots, images, CSS) passe inchangé. La
 * conversion est faite à la volée par HTMLRewriter : aucun fichier .md à
 * maintenir en double, donc rien à resynchroniser quand une page change.
 *
 * Deux passes : la première retire les zones sans intérêt pour un agent
 * ( scripts, décor, navigation, terminal factice), la seconde met en forme.
 * Une seule passe ne suffit pas : les gestionnaires de texte s'exécutent
 * avant que `remove()` ne s'applique au balisage.
 *
 * Le HTML reste la réponse par défaut : `Vary: Accept` est posé dans les deux
 * cas pour qu'aucun cache ne serve l'un à la place de l'autre.
 *
 * Le site est servi par un Worker « avec assets » (wrangler deploy), pas par
 * Pages : d'où `env.ASSETS.fetch()` et `run_worker_first` dans wrangler.toml.
 */

const MARKDOWN_TYPE = "text/markdown; charset=utf-8";

/** Vrai si le client demande explicitement du markdown (et ne le refuse pas). */
function wantsMarkdown(request) {
  const accept = request.headers.get("Accept") || "";
  const part = accept.split(",").find((value) => /text\/markdown/i.test(value));
  if (!part) return false;
  return !/;\s*q=0(\.0+)?\s*$/i.test(part.trim());
}

/** Éléments sans équivalent markdown : scripts, décor, navigation, faux terminal. */
const DROP_SELECTOR = [
  "script",
  "style",
  "noscript",
  "svg",
  "canvas",
  "template",
  "head",
  "nav",
  "footer",
  ".loader",
  ".skip-link",
  ".about-terminal",
  ".case-hero-art",
  ".video-bg",
  ".bg-grain",
  ".shader-canvas",
  ".smooth-cursor",
  ".scroll-progress",
  ".marquee",
  ".mobile-menu",
  ".section-glow",
  ".section-label",
  // La galerie est montée en JS : son balisage est vide sans exécution, et les
  // compteurs animés lisent « 0 » dans le HTML statique.
  ".project-coverflow",
  ".stats-row",
  ".coverflow-hint",
  ".balloons-layer",
].join(", ");

const BLOCK_SELECTOR = "p, figcaption, blockquote, dd, summary, caption, dt";

const ENTITIES = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

const CLEAN = (value) =>
  value
    .replace(/&(#?\w+);/g, (match, name) => ENTITIES[name] ?? match)
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^ /gm, "")
    .trim();

async function markdownFrom(html) {
  const withoutNoise = await new HTMLRewriter()
    .on(DROP_SELECTOR, {
      element(element) {
        element.remove();
      },
    })
    .transform(new Response(html))
    .text();

  const parts = [];
  let preserve = 0;
  // `text()` reçoit le texte du document, `mark()` les marqueurs de structure :
  // seuls les premiers subissent la compaction des espaces.
  const push = (value) => {
    parts.push(preserve ? value : value.replace(/\s+/g, " "));
  };
  const mark = (value) => parts.push(value);

  await new HTMLRewriter()
    .on("h1, h2, h3, h4, h5, h6", {
      element(element) {
        const level = Number(element.tagName.slice(1));
        mark(`\n\n${"#".repeat(level)} `);
        element.onEndTag(() => mark("\n"));
      },
    })
    .on(BLOCK_SELECTOR, {
      element(element) {
        mark(element.tagName === "dt" ? "\n" : "\n\n");
        element.onEndTag(() => mark("\n"));
      },
    })
    .on("ul, ol", {
      element(element) {
        mark("\n");
        element.onEndTag(() => mark("\n"));
      },
    })
    .on("li", {
      element(element) {
        mark("\n- ");
      },
    })
    .on("a", {
      element(element) {
        const href = element.getAttribute("href");
        if (!href) return;
        mark("[");
        element.onEndTag(() => mark(`](${href})`));
      },
    })
    .on("img", {
      element(element) {
        const alt = element.getAttribute("alt");
        const src = element.getAttribute("src") || "";
        // Les visuels décoratifs (alt vide) n'apportent rien en markdown.
        if (alt) push(`![${alt}](${src})`);
      },
    })
    .on("strong, b", {
      element(element) {
        mark("**");
        element.onEndTag(() => mark("**"));
      },
    })
    .on("em, i", {
      element(element) {
        mark("*");
        element.onEndTag(() => mark("*"));
      },
    })
    .on("code", {
      element(element) {
        mark("`");
        element.onEndTag(() => mark("`"));
      },
    })
    .on("pre, .terminal-body", {
      element(element) {
        preserve += 1;
        element.onEndTag(() => {
          preserve -= 1;
        });
      },
    })
    .on("br", {
      element(element) {
        mark("\n");
      },
    })
    .on("hr", {
      element(element) {
        mark("\n\n---\n\n");
      },
    })
    .on("*", {
      text(chunk) {
        push(chunk.text);
      },
    })
    .transform(new Response(withoutNoise))
    .text();

  return CLEAN(parts.join(""));
}

export default {
  async fetch(request, env) {
    const response = await env.ASSETS.fetch(request);
    const contentType = response.headers.get("Content-Type") || "";
    const isHtml = contentType.includes("text/html");

    if (!wantsMarkdown(request) || !isHtml) {
      if (isHtml) {
        const passthrough = new Response(response.body, response);
        passthrough.headers.set("Vary", "Accept");
        return passthrough;
      }
      return response;
    }

    const markdown = await markdownFrom(await response.text());
    const url = new URL(request.url);
    const footer =
      `\n\n---\n\nPage d'origine : ${url.origin}${url.pathname} — ` +
      `résumé lisible par les agents : ${url.origin}/llms.txt\n`;

    return new Response(markdown + footer, {
      status: 200,
      headers: {
        "Content-Type": MARKDOWN_TYPE,
        "Content-Language": "fr",
        Vary: "Accept",
        // Estimation usuelle : ~4 caractères par token en français.
        "x-markdown-tokens": String(Math.ceil((markdown.length + footer.length) / 4)),
        "Cache-Control": "public, max-age=0, must-revalidate",
      },
    });
  },
};
