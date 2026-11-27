import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildAndroidBlocklist, serializeAndroidBlocklist } from '../src/compile/android';
import { buildIosRules, chunkRules } from '../src/compile/ios';
import { parseFilterLines } from '../src/ruleParser';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const filtersDir = join(root, 'filters');
const outDir = join(root, 'dist', 'mobile');
const rulesVersion = new Date().toISOString().slice(0, 10);

const files = readdirSync(filtersDir)
  .filter((f) => f.endsWith('.txt'))
  .sort();

const lines = files.flatMap((f) => readFileSync(join(filtersDir, f), 'utf8').split(/\r?\n/));
const parsed = parseFilterLines(lines);

rmSync(outDir, { recursive: true, force: true });
mkdirSync(join(outDir, 'android'), { recursive: true });
mkdirSync(join(outDir, 'ios'), { recursive: true });

const domains = buildAndroidBlocklist(parsed.network);
writeFileSync(
  join(outDir, 'android', 'blocklist.txt'),
  serializeAndroidBlocklist(domains, rulesVersion),
);

const wkChunks = chunkRules(buildIosRules(parsed));
wkChunks.forEach((rules, i) => {
  writeFileSync(join(outDir, 'ios', `blocker-${i + 1}.json`), JSON.stringify(rules, null, 2));
});

console.log(
  `Compiled mobile rules -> files=${files.length}, network=${parsed.network.length}, ` +
    `cosmetic=${parsed.cosmetic.length}, skipped=${parsed.skipped}, ` +
    `android_domains=${domains.length}, ios_files=${wkChunks.length}`,
);