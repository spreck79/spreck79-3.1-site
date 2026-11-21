# spreck79 3.1

All side quests. No main story.

A Prairie-style retro desktop with its own command line, S79-DOS, running right in the browser.

**Play it:** https://os.spreck79.com

- It boots into S79-DOS first, then starts the desktop. Press F8 while it boots to stay at the `C:\>` prompt.
- Type `HELP` at the prompt to list the commands.
- Files you save live in your own browser and stay there until you clear its site data.

## Working on it

The site is plain HTML, CSS and JavaScript, with no build step. GitHub Pages serves this repo's `main` branch at os.spreck79.com, so a push is a publish.

Preview it locally:

```
node tools/serve.js
```

Then open http://localhost:7931.

- `index.html`: the page.
- `style.css`: everything visual, built on the spreck79 design system's tokens.
- `js/`: the virtual disk (`fs.js`), window manager (`wm.js`), S79-DOS (`dos.js`), the apps (`apps.js`), icons and the shell that ties them together.
- `assets/`: the spreck79 logos.

(C) 1979-2026 spreck79 · [spreck79.com](https://spreck79.com)
