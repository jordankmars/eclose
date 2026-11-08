import type { Morph } from "./morph";

/**
 * Reads where every element is, changes the DOM once, then springs each one to
 * its new layout box. Reading everything before writing anything keeps it to a
 * single layout pass, and starting from `now()` means a morph that's already in
 * flight picks up from where it appears, not from where it was laid out.
 */
export function morph(morphs: Morph[], mutate: () => void): void {
	const from = morphs.map((m) => m.now());
	for (const m of morphs) m.release();
	mutate();
	morphs.forEach((m, i) => {
		m.go(from[i], m.measure());
	});
}
