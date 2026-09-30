# AVI marketing site

Static two-page site for the Las Vegas / Henderson launch.

- `index.html` — consumer homepage + waitlist + city vote
- `partners.html` — founding venue funnel (send this URL in outreach)

Repo: https://github.com/whimsyandweeds/avi-marketing

## Run locally

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080

## GitHub Pages

Settings → Pages → Deploy from branch `main` / root.
Live URL once enabled: https://whimsyandweeds.github.io/avi-marketing/
Partner page: https://whimsyandweeds.github.io/avi-marketing/partners.html

## Capture leads

Forms save to `localStorage` until a backend exists.

1. Create a form at https://formspree.io
2. Paste the endpoint into `app.js`:

```js
const FORMSPREE_VENDOR = "https://formspree.io/f/xxxxxxxx";
const FORMSPREE_WAITLIST = "https://formspree.io/f/yyyyyyyy";
```

## Copy to swap

Replace the placeholder inbound email in the HTML before sending venue decks.
