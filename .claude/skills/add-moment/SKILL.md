---
name: add-moment
description: Turn a link (plus optional spoken bullets) into a published Museum Moments entry — capture a still or a short recording with a real browser, draft every field, show the curator two options, publish on their OK. Use whenever the user sends a URL to add, feature, or "moment" on the site.
---

# Add a moment from a link

The curator is usually on their phone. They send a link and maybe a few dictated bullets.
Your job: do everything else, show **two options in one message**, and publish only after they pick.
Their happy path is a single reply ("1" or "2").

## Ground rules

- **Never publish without an explicit pick/OK** in this conversation.
- **Never post a bad capture.** If the site blocks bots, shows a wall, or looks broken, say so and ask for a screenshot instead.
- Keep chat short — they're reading on a phone. Show media, not process.
- Work in the scratchpad directory, not the repo. Nothing gets committed.

## 1. Look at the site

Playwright + Chromium are pre-installed (`require('playwright')` works from any directory; never `playwright install`). Write small `.cjs` scripts in the scratchpad and run them with `node`.

If the host is unreachable (`connect_rejected`/403 from the proxy), stop and tell the user the environment needs **Full** network access (cloud environment settings → Network access) — every link is a new domain.

Scout first: a desktop-width screenshot of the top, plus a low-res full-page screenshot, plus page text. Look at them (Read the images) before deciding anything.

```js
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.goto(URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(1500);
  await p.screenshot({ path: 'scout-top.png' });
  await p.screenshot({ path: 'scout-full.png', fullPage: true, scale: 'css' });
  console.log(JSON.stringify(await p.evaluate(() => ({
    title: document.title,
    description: document.querySelector('meta[name=description]')?.content,
    author: document.querySelector('meta[name=author]')?.content,
    ogSite: document.querySelector('meta[property="og:site_name"]')?.content,
    text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 2500),
    links: [...document.querySelectorAll('a[href]')].map(a => a.href)
      .filter(h => /twitter|x\.com|instagram|github|linkedin|bsky|are\.na|read\.cv|about/i.test(h)).slice(0, 15),
  }))));
  await b.close();
})();
```

Dismiss cookie/consent banners (click "Accept"/"OK") before any capture. Lazy-loaded pages: scroll through once first.

## 2. Decide what's worth capturing

Ask: *what is the moment?* — the thing the curator would point at.

- **Motion is the point** (endless scroll, scroll-driven effects, hover/cursor play, generative animation, transitions) → a **recording**.
- **Composition is the point** (layout, type, color, a hero, a detail) → a **still**.
- Then pick the two options as **two genuinely different takes**: e.g. recording vs. still, or wide composition vs. tight detail, or two different sections. Never two near-duplicates.
- If the user said "record it" or "screenshot it", both options follow that instruction.

## 3. Capture

**Format (both kinds):** 3:4 portrait — the grid crops to 3:4. Center the interesting part; avoid empty margins and browser chrome.

### Still → 1200×1600 PNG
- Desktop layout: viewport `1200×1600`, `deviceScaleFactor: 1`.
- Tighter detail, crisper: viewport `600×800`, `deviceScaleFactor: 2`.
- Specific region: `page.screenshot({ clip: { x, y, width, height } })` with a 3:4 clip at `deviceScaleFactor: 2`, so the output is ≥1200px wide.
- Scroll to the spot (`window.scrollTo`), wait ~800ms for lazy images/effects, then shoot.

### Recording → MP4 loop, 6–8s, under 4.5MB
Record with a 3:4 viewport, drive the motion deterministically, then trim and encode.

```js
const t0 = Date.now();
const ctx = await b.newContext({ viewport: { width: 900, height: 1200 }, recordVideo: { dir: 'raw', size: { width: 900, height: 1200 } } });
const p = await ctx.newPage();
// goto, settle, dismiss banners, scroll to the start position…
const start = (Date.now() - t0) / 1000;
// Smooth constant-speed scroll (adjust speed/seconds; or hover/move the mouse instead)
await p.evaluate(({ secs, speed }) => new Promise(r => {
  const s = performance.now(), y0 = scrollY;
  const step = now => { const t = (now - s) / 1000; scrollTo(0, y0 + t * speed); t < secs ? requestAnimationFrame(step) : r(); };
  requestAnimationFrame(step);
}), { secs: 8, speed: 120 });
const v = p.video(); await ctx.close(); console.log(start, await v.path());
```

```bash
ffmpeg -y -ss <start> -t 8 -i raw/<file>.webm -an -c:v libx264 -preset slow -crf 26 \
  -pix_fmt yuv420p -movflags +faststart loop.mp4
```

Think the motion through before recording: where does it start, what moves, how fast reads well (≈80–150px/s for scroll), does the end flow back into the start when it loops? For hover/cursor pieces, script `page.mouse.move` along a path. For autoplaying animation, just wait.

**Check your own work:** you can't watch video, so pull 3 frames (`ffmpeg -ss <t> -i loop.mp4 -frames:v 1 f.png` at start/middle/end) and look at them. Confirm with `ffprobe` that it's H.264, 900×1200, ≤8s, and `ls -l` that it's under 4.5MB (raise `-crf` or shorten if not). Redo anything blank, mid-load, or covered by a banner.

## 4. Draft every field

| Field | How |
|---|---|
| `title` | Name of the work/site, not a tagline. |
| `creatorName` / `creatorUrl` | The actual person or studio (meta author, footer credit, about page, socials). `creatorUrl` = their own site/profile. Leave empty rather than guess. |
| `sourceUrl` | The link the user sent. |
| `category` | Exactly one of: **Branding** (logos, identity) · **Images** (photo, illustration, posters) · **Interfaces** (web, apps, product UI) · **Objects** (physical products, packaging) · **Spaces** (architecture, interiors) · **Typography** (typefaces, lettering). |
| `description` | 2–4 sentences. The user's bullets are the spine — keep their point of view and any memorable phrasing. Editorial and specific: name what to look at and why it works. Calm museum-label voice; no hype words ("stunning", "amazing", "game-changer"), no emoji. |
| `tags` | 3–6 lowercase, hyphenated. Prefer existing ones (`src/lib/constants.ts` TAG_SUGGESTIONS). |
| `year` | Always try: launch post, blog/changelog dates, press, © year, meta dates. Clearly stated → use it. Only a hint (e.g. a © year that may just be the current year) → propose it as approximate (`yearApproximate: true`). Nothing found → leave it blank and ask the curator in step 5. Never publish without a year or an explicit "no year". |

No bullets from the user? Write the description from what you observed and say so in one line.

## 5. Show the options (one message)

1. Send both media files with `SendUserFile` (`display: "render"`), captioned "Option 1 — …" / "Option 2 — …" in a few words.
2. In text: the full draft, compact — title · creator · category · year · tags, then the description. Say in a few words where the year came from (or that you couldn't find one).
3. Ask with `AskUserQuestion`: options **"Ship option 1"** and **"Ship option 2"** (the built-in "Other" is their free-text field for changes, e.g. "2 but slower", "warmer description", "record the footer instead").
   If the year is approximate or missing, add a second question in the same call: "What year should it show?" with options like **"c. <year> (approximate)"**, **"<year> (exact)"** and **"No year"** — the curator's "Other" lets them type a different year.

Free-text reply → apply it, show only what changed, ask again. Aim for at most one revision round.

## 6. Publish

Needs `ADMIN_PASSWORD` in the environment (cloud environment settings → environment variables). Site: `https://museum-moments.com`.

```bash
# Upload media → returns {"url": "https://….public.blob.vercel-storage.com/…"}
curl -sS -X POST https://museum-moments.com/api/upload \
  -H "x-admin-password: $ADMIN_PASSWORD" -F "file=@loop.mp4;type=video/mp4"

# Create the moment (write the JSON to a file to avoid quoting issues)
curl -sS -X POST https://museum-moments.com/api/moments \
  -H "x-admin-password: $ADMIN_PASSWORD" -H "Content-Type: application/json" -d @moment.json
```

`moment.json`: `{ title, category, description, sourceUrl, creatorName, creatorUrl, tags: [...], year, yearApproximate, imageUrl: <uploaded url> }`. Slug is generated from the title; on `409` (slug taken) add a short suffix via `"slug"`.

## 7. Verify, then hand back the link

Open `https://museum-moments.com/m/<slug>` and the home page in Playwright at phone width (390×844, DPR 3). Confirm the media loads (video plays, still isn't cropped badly) and the text is right. Send the detail-page screenshot and the live link. Done.

To fix something after publishing: `PATCH /api/moments/<slug>` with the changed fields (same password header), or the edit panel in `/admin`.
