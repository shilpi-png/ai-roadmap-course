# AI Engineering Roadmap — Course

A small, self-contained course site (like a Coursera course page) built from
the AI Engineering Roadmap. No installs, no build step, no server.

## Run it

Just open the page in a browser:

```
open index.html
```

or double-click `index.html` in Finder. That's it.

If you'd rather serve it (optional):

```
python3 -m http.server 8000
# then visit http://localhost:8000
```

## What's inside

| File | Purpose |
|---|---|
| `index.html` | Page layout (header, tabs, sidebar, content) |
| `style.css` | Coursera-like styling |
| `app.js` | Rendering + progress tracking |
| `course-data.js` | **All the course content** — edit this to change lessons, videos, or assignments |

## How it works

- **Two person tabs** — Shilpi and Friend. Same course, but assignments are
  tagged `who: "shilpi" | "friend" | "both"`. In your tab, your partner's
  exclusive assignments show dimmed with a label.
- **Progress is per person** and saved in the browser's `localStorage`, so
  each of you keeps your own checklist. (It's per-browser — if you clear
  site data, the checks reset.)
- **Phases** appear in the left sidebar with mini progress bars; click one to
  open it. Each phase has lessons (reading), videos (embedded YouTube), and
  assignments (checkboxes).

## Editing the course

Everything lives in `course-data.js`. Each phase is a list of blocks:

```js
{ type: "lesson", title: "...", body: "..." }
{ type: "video",  title: "...", youtube: "VIDEO_ID", link: "https://..." }
{ type: "task",   title: "...", who: "both", detail: "..." }
```

Add, remove, or reorder blocks freely — the page picks them up on refresh.
