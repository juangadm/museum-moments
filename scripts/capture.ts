/**
 * Capture a website for a new moment: screenshot candidates, an optional
 * scrolling/animated video loop, and page metadata for drafting the entry.
 *
 * Usage:
 *   npm run capture -- <url> [--video] [--still] [--seconds 8] [--speed 120] [--from 0] [--out dir]
 *
 *   --video    Also record an MP4 loop (scrolls the page by default)
 *   --still    With --video: don't scroll, just record on-page animation
 *   --seconds  Video length (default 8)
 *   --speed    Scroll speed in px/sec for the video (default 120)
 *   --from     Scroll position (px) where the video starts (default 0)
 *
 * Output (captures/<host>/):
 *   desktop-1.png …  1200x1600 at desktop layout (top, then further down)
 *   detail-1.png …   1200x1600 zoomed-in (600x800 @2x) — crisper, closer crop
 *   loop.mp4         Video loop (with --video), plus loop-poster.jpg
 *   meta.json        Title, description, OG tags, headings, text excerpt, links
 */
import { chromium, type Page } from "playwright";
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import path from "node:path";

function parseArgs(argv: string[]) {
  const args: Record<string, string | boolean> = {};
  const positional: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[a.slice(2)] = next;
        i++;
      } else {
        args[a.slice(2)] = true;
      }
    } else {
      positional.push(a);
    }
  }
  return { args, positional };
}

const { args, positional } = parseArgs(process.argv.slice(2));
const url = positional[0];
if (!url) {
  console.error("Usage: npm run capture -- <url> [--video] [--still] [--seconds 8] [--speed 120] [--from 0]");
  process.exit(1);
}

const host = new URL(url).hostname.replace(/^www\./, "");
const outDir = path.resolve(String(args.out || path.join("captures", host)));
const seconds = Number(args.seconds || 8);
const speed = Number(args.speed || 120);
const from = Number(args.from || 0);

const LAYOUTS = {
  desktop: { viewport: { width: 1200, height: 1600 }, deviceScaleFactor: 1 },
  detail: { viewport: { width: 600, height: 800 }, deviceScaleFactor: 2 },
} as const;

async function settle(page: Page) {
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
  } catch {
    // Sites with long-polling never go idle; "load" is good enough
    await page.waitForLoadState("load").catch(() => {});
  }
  // Dismiss common cookie/consent banners
  const consent = page.getByRole("button", { name: /^(accept|accept all|agree|i agree|got it|ok|allow all)$/i });
  if (await consent.first().isVisible().catch(() => false)) {
    await consent.first().click({ timeout: 2000 }).catch(() => {});
  }
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1500);
}

async function captureStills(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const files: string[] = [];
  for (const [name, layout] of Object.entries(LAYOUTS)) {
    const context = await browser.newContext(layout);
    const page = await context.newPage();
    await settle(page);
    const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const maxScroll = Math.max(0, scrollHeight - layout.viewport.height);
    // Top of page, then up to two more evenly spaced positions further down
    const positions = maxScroll > 0 ? [0, Math.round(maxScroll / 3), Math.round((maxScroll * 2) / 3)] : [0];
    for (const [i, y] of positions.entries()) {
      await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), y);
      await page.waitForTimeout(800); // let lazy images and scroll effects land
      const file = path.join(outDir, `${name}-${i + 1}.png`);
      await page.screenshot({ path: file });
      files.push(file);
    }
    await context.close();
  }
  return files;
}

async function captureMeta(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const page = await browser.newPage();
  await settle(page);
  const meta = await page.evaluate(() => {
    const m = (sel: string) => document.querySelector(sel)?.getAttribute("content") || null;
    const text = (sel: string) =>
      Array.from(document.querySelectorAll(sel))
        .map((el) => (el as HTMLElement).innerText.trim())
        .filter(Boolean)
        .slice(0, 10);
    const links = Array.from(document.querySelectorAll("a[href]"))
      .map((a) => (a as HTMLAnchorElement).href)
      .filter((h) => /twitter\.com|x\.com|instagram\.com|github\.com|linkedin\.com|mastodon|bsky\.app|are\.na|dribbble|behance/i.test(h));
    return {
      title: document.title,
      description: m('meta[name="description"]'),
      author: m('meta[name="author"]'),
      ogTitle: m('meta[property="og:title"]'),
      ogDescription: m('meta[property="og:description"]'),
      ogSiteName: m('meta[property="og:site_name"]'),
      ogImage: m('meta[property="og:image"]'),
      twitterCreator: m('meta[name="twitter:creator"]'),
      headings: text("h1, h2"),
      excerpt: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 2000),
      socialLinks: Array.from(new Set(links)).slice(0, 10),
    };
  });
  await page.close();
  return { url, capturedAt: new Date().toISOString(), ...meta };
}

async function captureVideo(browser: Awaited<ReturnType<typeof chromium.launch>>) {
  const size = { width: 900, height: 1200 };
  const rawDir = path.join(outDir, ".raw");
  const contextStart = Date.now();
  const context = await browser.newContext({ viewport: size, recordVideo: { dir: rawDir, size } });
  const page = await context.newPage();
  await settle(page);
  await page.evaluate((top) => window.scrollTo({ top, behavior: "instant" }), from);
  await page.waitForTimeout(500);

  const startOffset = (Date.now() - contextStart) / 1000;
  if (args.still) {
    await page.waitForTimeout(seconds * 1000);
  } else {
    // Smooth, constant-speed scroll driven by requestAnimationFrame
    await page.evaluate(
      ({ seconds, speed, from }) =>
        new Promise<void>((resolve) => {
          const start = performance.now();
          const step = (now: number) => {
            const t = (now - start) / 1000;
            window.scrollTo({ top: from + t * speed, behavior: "instant" });
            if (t < seconds) requestAnimationFrame(step);
            else resolve();
          };
          requestAnimationFrame(step);
        }),
      { seconds, speed, from }
    );
  }

  const video = page.video();
  await context.close();
  const rawPath = await video!.path();

  const mp4 = path.join(outDir, "loop.mp4");
  // H.264 + faststart so it autoplays everywhere (Safari included) and streams quickly
  execFileSync("ffmpeg", [
    "-y", "-loglevel", "error",
    "-ss", startOffset.toFixed(2), "-t", String(seconds), "-i", rawPath,
    "-an", "-c:v", "libx264", "-preset", "slow", "-crf", "26",
    "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4,
  ]);
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", mp4, "-frames:v", "1", "-q:v", "3", path.join(outDir, "loop-poster.jpg")]);
  rmSync(rawDir, { recursive: true, force: true });
  return mp4;
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  try {
    console.log(`Capturing ${url} → ${path.relative(process.cwd(), outDir)}/`);
    const meta = await captureMeta(browser);
    writeFileSync(path.join(outDir, "meta.json"), JSON.stringify(meta, null, 2));
    const stills = await captureStills(browser);
    stills.forEach((f) => console.log(`  still  ${path.relative(process.cwd(), f)}`));
    if (args.video) {
      const mp4 = await captureVideo(browser);
      console.log(`  video  ${path.relative(process.cwd(), mp4)}`);
    }
    console.log(`  meta   ${path.relative(process.cwd(), path.join(outDir, "meta.json"))}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

