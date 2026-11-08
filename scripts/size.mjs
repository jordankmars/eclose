// Fails the build if the package outgrows its promise. Everything an installer
// downloads for the React entry counts, so all built JavaScript is measured.

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const BUDGET = 5000;
const DIST = "dist";

const files = readdirSync(DIST, { recursive: true, encoding: "utf8" })
	.filter((file) => file.endsWith(".mjs"))
	.map((file) => readFileSync(join(DIST, file)));
const size = gzipSync(Buffer.concat(files), { level: 9 }).length;

console.log(`eclose: ${size} B gzip (budget ${BUDGET} B)`);
if (size > BUDGET) {
	console.error(`eclose: ${size - BUDGET} B over budget`);
	process.exit(1);
}
