#!/usr/bin/env node
/**
 * i18n / RTL hygiene check for apps/web.
 *
 *   1. Message parity   — every key in messages/en.json exists in messages/fa.json
 *                         and vice versa.
 *   2. ICU plurals      — plural messages declare only CLDR categories valid for the locale
 *                         (en: zero/one/two/few/many/other, fa: one/other).
 *   3. Hardcoded strings— scans src/**\/*.tsx for likely-untranslated English:
 *                           - JSX text nodes containing Latin words.
 *                           - aria-label/title/placeholder/alt string literals.
 *   4. Physical RTL     — scans src/**\/*.{tsx,ts,css} for direction-dependent Tailwind
 *                         utilities (ml-/mr-/pl-/pr-, text-left/right, float-left/right,
 *                         layout left-* / right-*) that should use logical equivalents.
 *
 * Limitations (by design — see docs/RTL_AUDIT.md):
 *   - Regex-based: it cannot reason about runtime string building. Strings assembled in
 *     plain .ts helpers are NOT scanned (only .tsx JSX/attributes).
 *   - JSX text heuristic: comparison/ternary expressions (`a > b : c < d`) are excluded,
 *     which also means user-facing text containing `= : ( ) [ ] { } + * & |` characters
 *     inside JSX text nodes would be skipped — such strings must go through t() anyway.
 *   - Translation *quality* is not checked; only presence/parity.
 *   - Allow-listed matches (documented below) are skipped. Keep the list explicit and small.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const SRC = join(ROOT, 'src');
const MESSAGES = join(ROOT, 'messages');

const failures = [];
const fail = (msg) => failures.push(msg);

/* ------------------------------------------------------------------ files */

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const rel = (p) => relative(ROOT, p).split(sep).join('/');

/* ------------------------------------------------------- 1+2. message files */

function flatten(obj, prefix = '', out = new Map()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object') flatten(v, key, out);
    else out.set(key, String(v));
  }
  return out;
}

const en = flatten(JSON.parse(readFileSync(join(MESSAGES, 'en.json'), 'utf8')));
const fa = flatten(JSON.parse(readFileSync(join(MESSAGES, 'fa.json'), 'utf8')));

for (const key of en.keys()) if (!fa.has(key)) fail(`messages/fa.json missing key: ${key}`);
for (const key of fa.keys()) if (!en.has(key)) fail(`messages/en.json missing key: ${key}`);

const EN_CATEGORIES = ['zero', 'one', 'two', 'few', 'many', 'other'];
const FA_CATEGORIES = ['one', 'other']; // CLDR Persian: only one/other exist
const PLURAL_RE = /\{[^{}]*,\s*plural\s*,([^{}]*)\}/g;

function checkPlurals(messages, name, allowed) {
  for (const [key, value] of messages) {
    for (const m of value.matchAll(PLURAL_RE)) {
      const cats = [...m[1].matchAll(/(zero|one|two|few|many|other)\s*\{/g)].map((c) => c[1]);
      if (cats.length === 0 && !/=?\d+\s*{/.test(m[1])) {
        fail(`${name} ${key}: plural with no categories`);
      }
      for (const c of cats) {
        if (!allowed.includes(c)) fail(`${name} ${key}: invalid CLDR category '${c}'`);
      }
      if (!cats.includes('other')) fail(`${name} ${key}: plural missing required 'other'`);
    }
  }
}
checkPlurals(en, 'messages/en.json', EN_CATEGORIES);
checkPlurals(fa, 'messages/fa.json', FA_CATEGORIES);

/* ------------------------------------------------- 3. hardcoded JSX strings */

// JSX text node with Latin words:  >Some text here<
const JSX_TEXT_RE = />\s*([A-Za-z][A-Za-z0-9][A-Za-z0-9 .,'’"%:…\-]*?)\s*</g;
// String-literal attributes that must be translated.
const ATTR_LITERAL_RE =
  /\b(aria-label|title|placeholder|alt)\s*=\s*"([^"]*[A-Za-z]{2,}[^"]*)"/g;

const tsxFiles = walk(SRC).filter((f) => f.endsWith('.tsx'));
for (const file of tsxFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    const lineNo = idx + 1;
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) return;

    for (const m of line.matchAll(JSX_TEXT_RE)) {
      const text = m[1].trim();
      // Skip pure technical literals: codes, env flags, symbols-only, single words in CAPS.
      if (/^[A-Z0-9_\-=.:/%]+$/.test(text)) continue;
      // Skip comparison/ternary fragments (JS `a > b : c < d`), not JSX text.
      if (/[=:()[\]{}+*&|]/.test(text)) continue;
      fail(`${rel(file)}:${lineNo} hardcoded JSX string: "${text}"`);
    }
    for (const m of line.matchAll(ATTR_LITERAL_RE)) {
      const value = m[2];
      if (/^[A-Za-z0-9@._\-]+$/.test(value) && !/ /.test(value)) continue; // emails, codes
      fail(`${rel(file)}:${lineNo} hardcoded ${m[1]} attribute: "${value}"`);
    }
  });
}

/* -------------------------------------------- 4. physical-direction classes */

const PHYSICAL_RE =
  /(^|[\s"'`])(ml|mr|pl|pr)-|text-(left|right)|float-(left|right)|(^|[\s"'`])(left|right)-(\d|\[)/;

/**
 * Explicit allow-list: direction-independent or deliberately physical usage.
 * Each entry is documented in docs/RTL_AUDIT.md ("Remaining physical classes").
 */
const PHYSICAL_ALLOWLIST = [
  // Centered decorative blob: left:50% + -translate-x-1/2 is symmetric in both directions.
  { file: 'src/app/[locale]/login/page.tsx', match: 'left-1/2' },
];

const styleFiles = walk(SRC).filter((f) => /\.(tsx|ts|css)$/.test(f));
for (const file of styleFiles) {
  const lines = readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, idx) => {
    if (!PHYSICAL_RE.test(line)) return;
    const allowed = PHYSICAL_ALLOWLIST.some(
      (a) => rel(file) === a.file && line.includes(a.match),
    );
    if (allowed) return;
    fail(`${rel(file)}:${idx + 1} physical-direction class: ${line.trim().slice(0, 100)}`);
  });
}

/* ---------------------------------------------------------------- report */

if (failures.length) {
  console.error(`✖ i18n/RTL check failed with ${failures.length} problem(s):\n`);
  for (const f of failures) console.error(`  ${f}`);
  console.error('\nSee docs/RTL_AUDIT.md for conventions and the allow-list policy.');
  process.exit(1);
}
console.log(
  `✔ i18n/RTL check passed — ${en.size} keys in parity, ` +
    `${tsxFiles.length} components scanned for hardcoded strings, ` +
    `${styleFiles.length} files scanned for physical-direction classes.`,
);
