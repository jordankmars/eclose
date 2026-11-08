import type { Box } from "./geometry";
import { scrollParent } from "./lock";
import type { Morph } from "./morph";

// Swipe down to dismiss. Native touch events, because only preventDefault on a
// touchmove can stop a pan once the browser might take it, and they leave the
// mouse out by construction.

/** How far a finger goes before its gesture gets judged. */
const DECIDE_AFTER = 6;
/** How long of a recent stretch the throw speed is read from, in ms. */
const VELOCITY_WINDOW = 100;
/** How far ahead a throw is projected, in seconds. */
const PROJECT = 0.2;

export type Verdict = "wait" | "claim" | "abort";

/**
 * Judged once, so a gesture never changes hands midway: pulling down claims it,
 * but only if there's nothing above to scroll back to. `scrollTop` is null
 * when nothing under the finger scrolls.
 */
export function arbitrate(
	dx: number,
	dy: number,
	scrollTop: number | null,
): Verdict {
	if (Math.hypot(dx, dy) < DECIDE_AFTER) return "wait";
	if (Math.abs(dx) > dy) return "abort";
	return scrollTop === null || scrollTop <= 0 ? "claim" : "abort";
}

export interface Sample {
	t: number;
	y: number;
}

/** Speed at the moment of release, in pixels per second. */
export function releaseVelocity(samples: Sample[]): number {
	const last = samples[samples.length - 1];
	if (!last) return 0;
	const first =
		samples.find((s) => last.t - s.t <= VELOCITY_WINDOW) ?? samples[0];
	const dt = last.t - first.t;
	return dt > 0 ? ((last.y - first.y) / dt) * 1000 : 0;
}

/** Past this distance, or thrown past it, a release dismisses. */
export function dismisses(travel: number, v: number, height: number): boolean {
	return Math.max(travel, travel + v * PROJECT) > Math.min(height * 0.3, 120);
}

export interface SwipeOptions {
	morph: () => Morph | null;
	/** Whether a swipe may begin right now. */
	enabled: () => boolean;
	dismiss: () => void;
}

/** Makes `el` draggable downward. Returns the function that removes it. */
export function swipe(el: HTMLElement, options: SwipeOptions): () => void {
	let startX = 0;
	let startY = 0;
	let scroller: Element | null = null;
	let state: "idle" | "judging" | "dragging" = "idle";
	let morph: Morph | null = null;
	let rest: Box | null = null;
	let grabY = 0;
	let samples: Sample[] = [];

	const onStart = (e: TouchEvent) => {
		state = "idle";
		const target = e.target as Element;
		if (e.touches.length !== 1 || !options.enabled()) return;
		if (target.closest("input[type=range],[data-eclose-no-swipe]")) return;
		startX = e.touches[0].clientX;
		startY = e.touches[0].clientY;
		scroller = scrollParent(target, el);
		state = "judging";
	};

	const onMove = (e: TouchEvent) => {
		if (state === "idle") return;
		const { clientX, clientY } = e.touches[0];
		if (state === "judging") {
			const verdict = arbitrate(
				clientX - startX,
				clientY - startY,
				scroller ? scroller.scrollTop : null,
			);
			if (verdict === "wait") return;
			morph = options.morph();
			if (verdict === "abort" || !e.cancelable || !morph) {
				state = "idle";
				return;
			}
			state = "dragging";
			rest = morph.now();
			grabY = clientY;
			samples = [];
		}
		e.preventDefault();
		const travel = clientY - grabY;
		samples.push({ t: e.timeStamp, y: clientY });
		if (rest) {
			// Pulling back up past the start resists instead of tracking.
			morph?.drag({
				...rest,
				y: rest.y + (travel < 0 ? travel / 4 : travel),
			});
		}
	};

	const release = (cancelled: boolean) => {
		if (state !== "dragging" || !morph || !rest) {
			state = "idle";
			return;
		}
		state = "idle";
		const y = samples[samples.length - 1]?.y ?? grabY;
		const v = cancelled ? 0 : releaseVelocity(samples);
		morph.fling({ y: v });
		if (!cancelled && dismisses(y - grabY, v, rest.h)) options.dismiss();
	};
	const onEnd = () => release(false);
	const onCancel = () => release(true);

	const passive = { passive: true };
	el.addEventListener("touchstart", onStart, passive);
	el.addEventListener("touchmove", onMove, { passive: false });
	el.addEventListener("touchend", onEnd, passive);
	el.addEventListener("touchcancel", onCancel, passive);
	return () => {
		el.removeEventListener("touchstart", onStart);
		el.removeEventListener("touchmove", onMove);
		el.removeEventListener("touchend", onEnd);
		el.removeEventListener("touchcancel", onCancel);
	};
}
