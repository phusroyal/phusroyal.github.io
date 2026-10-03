# Repository Guidelines

## Project Structure & Module Organization

This repository is a Jekyll 3.9 academic homepage deployed to GitHub Pages. Root HTML files define the home, publications, and writing pages. `_layouts/` contains page templates; `_includes/` contains reusable Liquid components and widgets. `_data/` stores YAML profile, navigation, author, display, and citation data.

Content lives in `_publications/<year>/`, `_news/`, and `_writing/`. Writing pages use `/writing/:name/` URLs. `assets/` holds CSS, JavaScript, images, visualization data, and the CV; `embeds/` contains interactive HTML figures. `scripts/` contains the citation updater. `_site/` is generated output: edit source files instead.

## Build, Test, and Development Commands

- `bundle install`: install Ruby dependencies from `Gemfile`; CI uses Ruby 3.1.
- `bundle exec jekyll serve`: build and serve locally at `http://127.0.0.1:4000`. Restart after changing `_config.yml`.
- `bundle exec jekyll build`: generate the static site in `_site/` and check template/content compilation.
- `JEKYLL_ENV=production bundle exec jekyll build`: validate a production build before submitting changes.
- `python3 scripts/update_google_scholar_citations.py --dry-run`: preview citation updates. Omit `--dry-run` to update `_data/citations.yml`; use `--only 2023-vihos` to target one publication.

## Coding Style & Naming Conventions

Match nearby formatting: HTML, CSS, JavaScript, and Python generally use four-space indentation. Preserve existing YAML structure and Liquid whitespace. Use descriptive, lowercase, hyphenated content names; publication files follow `<year>-<slug>.md`. Keep required YAML front matter consistent with neighboring entries.

Use semantic CSS variables and the palette in `DESIGN_TOKENS.md`. Check both light and dark themes. Follow README math conventions: `\lbrace`/`\rbrace` for braces and `\lVert`/`\rVert` for norms. No formatter or linter is configured.

## Testing Guidelines

There is no automated test suite or coverage threshold. Require a successful Jekyll build, then inspect affected pages locally. Check navigation, images, citation links, math rendering, mobile layout, theme switching, and interactive figures where relevant. Do not commit generated `_site/` or dependency directories.

## Commit & Pull Request Guidelines

Recent commits use short, lowercase action descriptions such as `update theme, citations` and `add fega`. Follow that style and keep commits focused.

PRs should describe the change, list affected pages and validation performed, and link related issues when applicable. Include screenshots for visual changes. Pushes to `main` trigger the build and deployment workflow in `.github/workflows/jekyll.yml`.
