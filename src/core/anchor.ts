import type { Rect } from "./geometry";

// Where anchored content rests. It starts on top of its trigger, since the
// trigger is what it grows out of, and is pushed back on screen if needed.

export interface Point {
	x: number;
	y: number;
}

/** The point of the content that sits on the same point of its trigger. */
export type Origin =
	| "center"
	| "top"
	| "right"
	| "bottom"
	| "left"
	| "top-left"
	| "top-right"
	| "bottom-left"
	| "bottom-right";

/** An origin as a fraction of the box on each axis, from 0 to 1. */
export function alignment(origin: Origin = "center"): Point {
	const at = (start: string, end: string) =>
		origin.includes(start) ? 0 : origin.includes(end) ? 1 : 0.5;
	return { x: at("left", "right"), y: at("top", "bottom") };
}

/** Keeps content this far from the viewport edge. */
const GUTTER = 8;

function axis(
	start: number,
	triggerSize: number,
	size: number,
	viewStart: number,
	viewSize: number,
	align: number,
): number {
	const min = viewStart + GUTTER;
	const max = viewStart + viewSize - GUTTER - size;
	const slack = triggerSize - size;
	const wanted = start + slack * align;
	const mirrored = start + slack * (1 - align);
	// Overflowing: line up the trigger's other edge instead, if that fits.
	const at =
		(wanted < min || wanted > max) && mirrored >= min && mirrored <= max
			? mirrored
			: wanted;
	return Math.max(min, Math.min(at, max));
}

/**
 * The top-left corner for content of `size` anchored to `trigger`, all in the
 * same coordinate space. `align` is the point of each that lines up, and
 * defaults to their top-left. Content bigger than the viewport pins to the start.
 */
export function place(
	trigger: Rect,
	size: Pick<Rect, "w" | "h">,
	view: Rect,
	align: Point = { x: 0, y: 0 },
): Point {
	return {
		x: axis(trigger.x, trigger.w, size.w, view.x, view.w, align.x),
		y: axis(trigger.y, trigger.h, size.h, view.y, view.h, align.y),
	};
}

/** The visible area in page coordinates, which excludes the iOS keyboard. */
export function viewport(): Rect {
	const v = window.visualViewport;
	return v
		? { x: v.pageLeft, y: v.pageTop, w: v.width, h: v.height }
		: { x: scrollX, y: scrollY, w: innerWidth, h: innerHeight };
}

/**
 * Calls `onChange` when anything happens that could move the trigger or
 * shrink the viewport. Scrolling only counts if it could carry the trigger.
 */
export function watch(
	trigger: () => Element | null,
	onChange: () => void,
): () => void {
	const onScroll = (e: Event) => {
		const el = trigger();
		if (el && (e.target as Node).contains(el)) onChange();
	};
	const v = window.visualViewport;
	addEventListener("resize", onChange);
	document.addEventListener("scroll", onScroll, true);
	v?.addEventListener("resize", onChange);
	v?.addEventListener("scroll", onChange);
	return () => {
		removeEventListener("resize", onChange);
		document.removeEventListener("scroll", onScroll, true);
		v?.removeEventListener("resize", onChange);
		v?.removeEventListener("scroll", onChange);
	};
}
