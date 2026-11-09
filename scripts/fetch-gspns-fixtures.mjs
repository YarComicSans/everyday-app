#!/usr/bin/env node
/**
 * Downloads the GSPNS test fixtures into src/services/gspns/__fixtures__ from the live site.
 * The folder is gitignored — this script is the only source of its contents.
 *
 *   npm run fixtures:update            # (re)download everything
 *   npm run fixtures:update -- <dir>   # write somewhere else (e.g. to diff against the current ones)
 *   node scripts/fetch-gspns-fixtures.mjs --if-missing   # no-op when all files exist (used by `pretest`)
 *
 * The tests only check that these snapshots still parse into usable data; they assert no
 * timetable-specific values, so refreshing the snapshots needs no test changes.
 */
import { access, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SITE = "https://www.gspns.rs";
const BASE = `${SITE}/red-voznje`;
const RV = "rvg";
const DAY_TYPES = ["R", "S", "N", "P"];
/** Line-list snapshots the tests read (there is no holiday one). */
const LINE_LIST_DAYS = ["R", "S", "N"];
/** `p4.html`: a single two-direction line on a working day. */
const SINGLE_LINE = "4*";
/** Network map: `mreza.html` at the top, per-line stops and polylines in this subfolder. */
const MAP_DIR = "mreza";
/** Parallel requests when downloading the per-line map files. */
const MAP_CONCURRENCY = 4;

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const ifMissing = args.includes("--if-missing");
const outDir = resolve(
  args.find((a) => !a.startsWith("--")) ??
    join(root, "src/services/gspns/__fixtures__"),
);

/** Every file this script writes. */
const FILES = [
  "gradski.html",
  "p4.html",
  ...LINE_LIST_DAYS.map((day) => `l_${RV}${day}.html`),
  ...DAY_TYPES.map((day) => `all_${RV}_${day}.html`),
  "mreza.html",
];

/** Lines whose map files were saved; the tests iterate over it. Some lines' endpoints fail permanently. */
const MAP_INDEX = join(MAP_DIR, "ids.json");
const mapFiles = (ids) =>
  ids.flatMap((id) => [
    join(MAP_DIR, `stops-${id}.json`),
    join(MAP_DIR, `path-${id}.json`),
  ]);

const exists = (path) =>
  access(path).then(
    () => true,
    () => false,
  );

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${url}`);
  return res.text();
}

async function write(name, body, url) {
  await writeFile(join(outDir, name), body);
  console.log(
    `  ${name.padEnd(22)} ${(body.length / 1024).toFixed(1).padStart(6)} KB  ${url}`,
  );
}

async function save(name, url) {
  const body = await get(url);
  await write(name, body, url);
  return body;
}

/** Same lookup as parseTimetableInfo: the selected #vaziod option, else the first one. */
function validFrom(html) {
  const select = html.match(
    /<select[^>]*id=['"]vaziod['"][^>]*>([\s\S]*?)<\/select>/i,
  )?.[1];
  const options = [
    ...(select ?? "").matchAll(/<option[^>]*value=["']([^"']+)["']([^>]*)>/gi),
  ];
  const option = options.find((m) => /\bselected\b/i.test(m[2])) ?? options[0];
  if (!option)
    throw new Error(
      "gradski.html: no #vaziod option — did the page layout change?",
    );
  return option[1];
}

const lineValues = (html) =>
  [...html.matchAll(/<option[^>]*value=["']([^"']+)["']/gi)].map((m) => m[1]);

/** Ids of the city-line buttons, matching what parseMapLines reads (`a.button-linija.grad`). */
function cityLineIds(html) {
  const ids = [...html.matchAll(/<a\b[^>]*>/gi)]
    .map((m) => m[0])
    .filter((tag) => {
      const cls =
        tag.match(/\bclass=["']([^"']*)["']/i)?.[1].split(/\s+/) ?? [];
      return cls.includes("button-linija") && cls.includes("grad");
    })
    .map((tag) => Number(tag.match(/\bid=["']?(\d+)/i)?.[1]))
    .filter(Number.isInteger);
  if (ids.length === 0)
    throw new Error(
      "mreza.html: no city line buttons — did the page layout change?",
    );
  return [...new Set(ids)];
}

/** Runs `task` over `items`, at most `limit` at a time. */
async function pool(items, limit, task) {
  let next = 0;
  const worker = async () => {
    while (next < items.length) await task(items[next++]);
  };
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, worker),
  );
}

const lineListUrl = (from, day) =>
  `${BASE}/lista-linija?rv=${RV}&vaziod=${encodeURIComponent(from)}&dan=${day}`;
const departuresUrl = (from, day, values) =>
  `${BASE}/ispis-polazaka?rv=${RV}&vaziod=${encodeURIComponent(from)}&dan=${day}&` +
  values.map((v) => `linija[]=${encodeURIComponent(v)}`).join("&");

async function main() {
  if (ifMissing) {
    const allExist = async (files) =>
      (await Promise.all(files.map((f) => exists(join(outDir, f))))).every(
        Boolean,
      );
    if (
      (await allExist([...FILES, MAP_INDEX])) &&
      (await allExist(
        mapFiles(JSON.parse(await readFile(join(outDir, MAP_INDEX), "utf8"))),
      ))
    ) {
      return;
    }
    console.log("GSPNS fixtures missing — downloading them first.");
  }
  await mkdir(outDir, { recursive: true });
  console.log(`Writing fixtures to ${outDir}\n`);

  const from = validFrom(await save("gradski.html", `${BASE}/gradski`));
  console.log(`\n  timetable valid from ${from}\n`);

  for (const day of DAY_TYPES) {
    const url = lineListUrl(from, day);
    const list = LINE_LIST_DAYS.includes(day)
      ? await save(`l_${RV}${day}.html`, url)
      : await get(url);
    const values = lineValues(list);
    if (values.length === 0) throw new Error(`no lines for day ${day}`);
    await save(`all_${RV}_${day}.html`, departuresUrl(from, day, values));
  }
  await save("p4.html", departuresUrl(from, "R", [SINGLE_LINE]));

  const ids = cityLineIds(await save("mreza.html", `${SITE}/mreza`));
  // Start clean so lines GSPNS has dropped from the map don't linger.
  await rm(join(outDir, MAP_DIR), { recursive: true, force: true });
  await mkdir(join(outDir, MAP_DIR));
  console.log(`\n  ${ids.length} city lines on the network map\n`);
  const saved = [];
  const skipped = [];
  await pool(ids, MAP_CONCURRENCY, async (id) => {
    const stopsUrl = `${SITE}/mreza-get-stajalista-tacke?linija=${id}`;
    const pathUrl = `${SITE}/mreza-get-linija-tacke?linija=${id}`;
    let bodies;
    try {
      bodies = await Promise.all([get(stopsUrl), get(pathUrl)]);
    } catch (e) {
      skipped.push(`${id} (${e.message.split(":")[0]})`);
      return;
    }
    await write(join(MAP_DIR, `stops-${id}.json`), bodies[0], stopsUrl);
    await write(join(MAP_DIR, `path-${id}.json`), bodies[1], pathUrl);
    saved.push(id);
  });
  if (saved.length === 0)
    throw new Error("no network-map line could be downloaded");
  await writeFile(
    join(outDir, MAP_INDEX),
    JSON.stringify(saved.sort((a, b) => a - b)),
  );
  if (skipped.length)
    console.log(
      `\n  skipped map lines the site fails to serve: ${skipped.join(", ")}`,
    );

  console.log("\nDone.");
}

main().catch((e) => {
  console.error(`\nFailed: ${e.message}`);
  process.exit(1);
});
