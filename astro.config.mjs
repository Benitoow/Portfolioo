import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));

const STATIC_DIRS = [
  "audios",
  "css",
  "cv",
  "docs",
  "fonts",
  "images",
  "js",
  "Projet",
  "videos",
  ".well-known",
];

const STATIC_FILES = [
  "_headers",
  ".nojekyll",
  "llms.txt",
  "robots.txt",
  "sitemap.xml",
];

const MIME_MAP = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
  ".mp3": "audio/mpeg",
  ".pdf": "application/pdf",
  ".json": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
};

function rootStaticIntegration() {
  return {
    name: "portfolio-root-static",
    hooks: {
      "astro:server:setup": ({ server }) => {
        server.middlewares.use((req, res, next) => {
          const rawUrl = decodeURIComponent((req.url || "/").split("?")[0]);
          const seg = rawUrl.replace(/^\/+/, "").split("/")[0];
          if (!STATIC_DIRS.includes(seg) && !STATIC_FILES.includes(seg)) {
            return next();
          }
          const target = path.join(ROOT, rawUrl);
          if (!target.startsWith(ROOT) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
            return next();
          }
          const ext = path.extname(target).toLowerCase();
          res.setHeader("Content-Type", MIME_MAP[ext] || "application/octet-stream");
          fs.createReadStream(target).pipe(res);
        });
      },
      "astro:build:done": ({ dir }) => {
        const outDir = fileURLToPath(dir);
        for (const folder of STATIC_DIRS) {
          const src = path.join(ROOT, folder);
          if (fs.existsSync(src)) {
            fs.cpSync(src, path.join(outDir, folder), { recursive: true, force: true });
          }
        }
        for (const file of STATIC_FILES) {
          const src = path.join(ROOT, file);
          if (fs.existsSync(src)) {
            fs.cpSync(src, path.join(outDir, file), { force: true });
          }
        }
        // Mirror built /competences.html and /_astro/* back to ROOT so wrangler [assets] directory = "." works directly
        const builtComp = path.join(outDir, "competences.html");
        if (fs.existsSync(builtComp)) {
          fs.cpSync(builtComp, path.join(ROOT, "competences.html"), { force: true });
        }
        const builtAstro = path.join(outDir, "_astro");
        const rootAstro = path.join(ROOT, "_astro");
        if (fs.existsSync(builtAstro)) {
          if (fs.existsSync(rootAstro)) {
            fs.rmSync(rootAstro, { recursive: true, force: true });
          }
          fs.cpSync(builtAstro, rootAstro, { recursive: true, force: true });
        }
      },
    },
  };
}

export default defineConfig({
  output: "static",
  build: {
    format: "file",
  },
  server: {
    port: 8787,
    host: true,
  },
  integrations: [react(), rootStaticIntegration()],
  vite: {
    plugins: [tailwindcss()],
  },
});
