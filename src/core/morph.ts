import { config } from "./config";
import { type Animated, track, untrack } from "./frame";
import {
	BOX_KEYS,
	type Box,
	cornerOf,
	pageBox,
	pageRect,
	projection,
	type Rect,
} from "./geometry";
import {
	isSettled,
	type SpringState,
	springConstants,
	stepSpring,
} from "./spring";

// One spring per box edge (x, y, width, height, radius), living in page space.
// Every frame the element is transformed from its real layout box to wherever
// the springs are.

type Springs = Record<keyof Box, SpringState>;

export interface MorphOptions {
	/**
	 * "transform" scales the element from its final layout, which is cheap and
	 * leaves siblings alone. "size" animates real width and height instead, so
	 * content reflows and clips rather than scales, and siblings move with it.
	 * Default "transform".
	 */
	mode?: "transform" | "size";
	/**
	 * When retargeted mid-flight, keep the current position and velocity so the
	 * motion bends toward the new target. Off restarts from rest. Default true.
	 */
	handoff?: boolean;
	/** Spring the corner radius and undo its distortion from scaling. Default true. */
	radius?: boolean;
	/**
	 * An inner wrapper that gets the inverse scale, so the content keeps its size
	 * while the box around it grows or shrinks. Without it, text stretches.
	 */
	counter?: HTMLElement | null;
	/** Called after every applied frame. */
	onFrame?: (morph: Morph) => void;
}

export class Morph implements Animated {
	readonly el: HTMLElement;
	options: MorphOptions;
	running = false;

	private springs: Springs | null = null;
	private layout: Rect = { x: 0, y: 0, w: 0, h: 0 };
	private done: (() => void) | null = null;
	private hold = false;

	constructor(el: HTMLElement, options: MorphOptions = {}) {
		this.el = el;
		this.options = options;
	}

	/** Where the springs are right now. Only meaningful while running. */
	current(): Box {
		const s = this.springs;
		if (!s) return pageBox(this.el);
		return { x: s.x.x, y: s.y.x, w: s.w.x, h: s.h.x, r: s.r.x };
	}

	/** Where the element appears right now, mid-flight or at rest. */
	now(): Box {
		return this.running || this.hold ? this.current() : pageBox(this.el);
	}

	/** Records the element's untransformed layout box and returns it. */
	measure(): Box {
		this.layout = pageRect(this.el);
		return { ...this.layout, r: cornerOf(this.el, this.layout) };
	}

	/** Clears every inline style the morph wrote, so layout can be read cleanly. */
	release(): void {
		this.hold = false;
		const st = this.el.style;
		st.transform = "";
		st.transformOrigin = "";
		if (this.options.mode === "size") {
			st.width = "";
			st.height = "";
		}
		if (this.options.radius !== false) st.borderRadius = "";
		const counter = this.options.counter?.style;
		if (counter) {
			counter.transform = "";
			counter.transformOrigin = "";
		}
	}

	/**
	 * Springs from `from` to `to`. Call `measure()` first so the morph knows the
	 * layout box it is transforming from.
	 */
	go(from: Box, to: Box, done: (() => void) | null = null): void {
		this.hold = false;
		if (config.reduced) {
			// Nothing travels: the element appears in place with a short fade.
			this.destroy();
			this.el.animate([{ opacity: 0.2 }, { opacity: 1 }], {
				duration: 200,
				easing: "ease-out",
			});
			done?.();
			return;
		}
		this.done = done;
		if (this.running && this.springs && this.options.handoff !== false) {
			for (const k of BOX_KEYS) this.springs[k].to = to[k];
		} else {
			const springs = {} as Springs;
			for (const k of BOX_KEYS) springs[k] = { x: from[k], v: 0, to: to[k] };
			this.springs = springs;
		}
		this.running = true;
		track(this);
		this.apply();
	}

	/**
	 * Springs toward a box that isn't this element's layout, like the thumbnail
	 * a detail view came from. The element keeps its own layout the whole time
	 * and is transformed onto the target, where it stays until the next
	 * `release()`, `go()` or `destroy()`.
	 */
	to(target: Box, done: (() => void) | null = null): void {
		const from = this.now();
		this.release();
		this.measure();
		this.go(from, target, done);
		this.hold = this.running;
	}

	step(dt: number): void {
		const s = this.springs;
		if (!s) return;
		const constants = springConstants(config);
		for (const k of BOX_KEYS) stepSpring(s[k], constants, dt);
		if (BOX_KEYS.every((k) => isSettled(s[k]))) this.finish();
		else this.apply();
	}

	/** Freezes the morph where it is, without clearing its styles. */
	stop(): void {
		untrack(this);
		this.running = false;
	}

	/**
	 * Ends the morph and runs its completion callback. A morph that landed on
	 * its own layout is released. One that landed elsewhere holds its last frame,
	 * because releasing would snap it home before the caller can hide it.
	 */
	finish(): void {
		this.stop();
		if (!this.hold) this.release();
		const done = this.done;
		this.done = null;
		done?.();
	}

	/** Stops without calling back and leaves the element as it was found. */
	destroy(): void {
		this.done = null;
		this.stop();
		this.release();
	}

	apply(): void {
		if (this.options.mode === "size") this.applySize();
		else this.applyTransform();
		this.options.onFrame?.(this);
	}

	private applySize(): void {
		const st = this.el.style;
		const { w, h, r } = this.current();
		const width = Math.max(w, 1);
		const height = Math.max(h, 1);
		st.width = `${width}px`;
		st.height = `${height}px`;
		if (this.options.radius !== false) {
			st.borderRadius = `${Math.max(0, Math.min(r, width / 2, height / 2))}px`;
		}
	}

	private applyTransform(): void {
		const st = this.el.style;
		const { tx, ty, sx, sy, rx, ry } = projection(this.layout, this.current());
		st.transformOrigin = "0 0";
		st.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
		if (this.options.radius !== false) st.borderRadius = `${rx}px / ${ry}px`;
		const counter = this.options.counter?.style;
		if (counter) {
			counter.transformOrigin = "0 0";
			counter.transform = `scale(${1 / sx}, ${1 / sy})`;
		}
	}
}
