# Fonts

The woff2 files in `../` are latin subsets (Google Fonts) of three families,
all under the SIL Open Font License 1.1:

| Family | Role | Designer / owner | Notice |
|---|---|---|---|
| Bricolage Grotesque | Titres | Mathieu Triay / Atelier Triay | `OFL-BricolageGrotesque.txt` |
| Inter Tight | Texte | The Inter Project Authors (Rasmus Andersson) | `OFL-InterTight.txt` |
| JetBrains Mono | Micro-typographie | JetBrains | `OFL-JetBrainsMono.txt` |

Each family is a variable font, so a single file covers the whole weight
range. The files are self-hosted: no font request leaves the domain, which
keeps the third-party origins out of the critical path and lets `_headers`
cache them for a year (see `/fonts/*`).
