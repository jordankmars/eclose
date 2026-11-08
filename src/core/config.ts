import type { SpringOptions } from "./spring";

// eclose ships one tuned spring. These knobs exist for the playground and for
// tests, not as public API.

export interface MotionConfig extends SpringOptions {
	/** Time scale. 0.25 plays everything at quarter speed. */
	speed: number;
	/** Swap morphs for a short crossfade. null follows the system setting. */
	reduced: boolean | null;
}

export const config: MotionConfig = {
	duration: 0.32,
	bounce: 0,
	speed: 1,
	reduced: null,
};

export function configure(next: Partial<MotionConfig>): void {
	Object.assign(config, next);
}

/** Asked at the start of every morph, so a system change applies right away. */
export function isReduced(): boolean {
	if (config.reduced !== null) return config.reduced;
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
