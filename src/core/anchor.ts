import type { Rect } from "./geometry";

// Where anchored content rests. It starts on top of its trigger, since the
// trigger is what it grows out of, and is pushed back on screen if needed.

export interface Point {
	x: number;
	y: number;
}

/** Keeps content this far from the viewport edge. */
const GUTTER = 8;

function axis(
	start: number,
	triggerSize: number,
	size: number,
	viewStart: number,
	viewSize: number,
): number {
	const min = viewStart + GUTTER;
	const max = viewStart + viewSize - GUTTER - size;
	const end = start + triggerSize - size;
	// Overflowing past the far edge: line up the trigger's other edge instead.
	const at = start > max && end >= min ? end : start;
	return Math.max(min, Math.min(at, max));
}

/**
 * The top-left corner for content of `size` anchored to `trigger`, all in the
 * same coordinate space. Content bigger than the viewport pins to the start.
 */
export function place(
	trigger: Rect,
	size: Pick<Rect, "w" | "h">,
	view: Rect,
): Point {
	return {
		x: axis(trigger.x, trigger.w, size.w, view.x, view.w),
		y: axis(trigger.y, trigger.h, size.h, view.y, view.h),
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
