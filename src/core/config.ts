import type { SpringOptions } from "./spring";

// eclose ships one tuned spring. These knobs exist for the playground and for
// tests, not as public API.

export interface MotionConfig extends SpringOptions {
	/** Time scale. 0.25 plays everything at quarter speed. */
	speed: number;
	/** Swap morphs for a short crossfade. */
	reduced: boolean;
}

function prefersReducedMotion(): boolean {
	if (typeof window === "undefined" || !window.matchMedia) return false;
	return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export const config: MotionConfig = {
	duration: 0.32,
	bounce: 0,
	speed: 1,
	reduced: prefersReducedMotion(),
};

export function configure(next: Partial<MotionConfig>): void {
	Object.assign(config, next);
}
