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
		return this.running ? this.current() : pageBox(this.el);
	}

	/** Records the element's untransformed layout box and returns it. */
	measure(): Box {
		this.layout = pageRect(this.el);
		return { ...this.layout, r: cornerOf(this.el, this.layout) };
	}

	/** Clears every inline style the morph wrote, so layout can be read cleanly. */
	release(): void {
		const st = this.el.style;
		st.transform = "";
		st.transformOrigin = "";
	}

	/**
	 * Springs from `from` to `to`. Call `measure()` first so the morph knows the
	 * layout box it is transforming from.
	 */
	go(from: Box, to: Box, done: (() => void) | null = null): void {
		this.done = done;
		const springs = {} as Springs;
		for (const k of BOX_KEYS) springs[k] = { x: from[k], v: 0, to: to[k] };
		this.springs = springs;
		this.running = true;
		track(this);
		this.apply();
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

	/** Ends the morph at rest and runs its completion callback. */
	finish(): void {
		this.stop();
		this.release();
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
		const st = this.el.style;
		const { tx, ty, sx, sy } = projection(this.layout, this.current());
		st.transformOrigin = "0 0";
		st.transform = `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`;
		this.options.onFrame?.(this);
	}
}
