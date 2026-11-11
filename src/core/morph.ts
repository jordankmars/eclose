import type { Point } from "./anchor";
import { config, isReduced } from "./config";
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

// Copied from the surface onto its content layer, so content laid out by the
// surface keeps the same layout while it's pulled out of flow for a flight.
const LAYOUT_PROPS = [
	"display",
	"gap",
	"gridTemplateColumns",
	"gridTemplateRows",
	"alignItems",
	"justifyItems",
	"alignContent",
	"justifyContent",
	"flexDirection",
	"flexWrap",
] as const;

// Every inline style a flying surface writes. Each one is put back as it was
// found, since the adapter's user may have set any of them.
const SURFACE_PROPS = [
	"boxSizing",
	"paddingTop",
	"paddingRight",
	"paddingBottom",
	"paddingLeft",
	"minWidth",
	"minHeight",
	"maxWidth",
	"maxHeight",
	"overflow",
	"contain",
	"transform",
	"width",
	"height",
	"marginRight",
	"marginBottom",
	"borderRadius",
	"opacity",
] as const;

/** What a surface looks like at rest, read just before it starts to fly. */
interface SurfaceRest {
	padLeft: number;
	padTop: number;
	contentW: number;
	contentH: number;
	marginRight: number;
	marginBottom: number;
	layout: string[];
}

const px = (value: string) => Number.parseFloat(value) || 0;
const unit = (value: number) => Math.max(0, Math.min(value, 1));

export interface MorphOptions {
	/**
	 * "transform" scales the element from its final layout, which is cheap and
	 * leaves siblings alone. "size" animates real width and height instead, so
	 * content reflows and clips rather than scales, and siblings move with it.
	 * "surface" animates real width and height plus a translate, so borders and
	 * shadows are drawn exactly, while `inner` holds still at its final size and
	 * is clipped. The surface's footprint in its parent never changes.
	 * Default "transform".
	 */
	mode?: "transform" | "size" | "surface";
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
	/**
	 * Surface mode: the layer holding the content. Rests as the adapter left it
	 * and is owned by the morph while it flies.
	 */
	inner?: HTMLElement | null;
	/**
	 * Surface mode: the point of the box the content stays lined up with as it
	 * grows, as a fraction on each axis. Default its top-left.
	 */
	align?: () => Point;
	/** Surface mode: fade the surface and its content with the motion. */
	fade?: boolean;
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
	private atRest: Box | null = null;
	// Surface mode only: how far open it is, 0 to 100. A spring of its own
	// because a surface that doesn't travel still has to fade.
	private fader: SpringState | null = null;
	/** Barely moves, so the fade is all there is to see. */
	private still = false;
	/** Has been fully opaque this flight, so it only fades near the trigger. */
	private whole = false;
	private rest: SurfaceRest | null = null;
	private surfaceStyles: string[] = [];
	private innerCss = "";
	private scrollTop = 0;
	private frozen = false;

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

	/** Parked or heading somewhere other than its own layout box. */
	get held(): boolean {
		return this.hold;
	}

	/** Surface mode: how far open it is, from 0 to 100. */
	get progress(): number {
		return this.fader?.x ?? 100;
	}

	/** Records the element's untransformed layout box and returns it. */
	measure(): Box {
		this.layout = pageRect(this.el);
		if (this.options.mode === "surface") this.readRest();
		this.atRest = { ...this.layout, r: cornerOf(this.el, this.layout) };
		return this.atRest;
	}

	/** Clears every inline style the morph wrote, so layout can be read cleanly. */
	release(): void {
		this.hold = false;
		if (this.options.mode === "surface") {
			this.unfreeze();
			return;
		}
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
		this.start(from, to, 100, done);
	}

	private start(
		from: Box,
		to: Box,
		fadeTo: number,
		done: (() => void) | null,
	): void {
		this.hold = false;
		const surface = this.options.mode === "surface";
		if (surface && isReduced()) {
			// Nothing travels, but the fade still runs on its spring.
			from = to;
		} else if (isReduced()) {
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
		if (surface) {
			this.freeze();
			const f = this.fader;
			if (this.running && f) f.to = fadeTo;
			else {
				this.fader = { x: 100 - fadeTo, v: 0, to: fadeTo };
				this.whole = !fadeTo;
				this.still =
					Math.hypot(
						to.x - from.x,
						to.y - from.y,
						to.w - from.w,
						to.h - from.h,
					) <
					(from.w + from.h) * 0.2;
			}
		}
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
		// A reduced surface fades out where it stands.
		const reduced = this.options.mode === "surface" && isReduced();
		this.start(from, reduced ? from : target, 0, done);
		this.hold = this.running;
	}

	/**
	 * Points a flight somewhere new because the layout changed under it: the
	 * window resized, or the content grew. Velocity and the completion callback
	 * carry over. With no target it heads for the element's fresh layout box.
	 */
	retarget(target?: Box): void {
		const s = this.springs;
		if (!this.running || !s) return;
		const held = this.hold;
		this.release();
		const box = this.measure();
		this.hold = held;
		const to = target ?? box;
		for (const k of BOX_KEYS) s[k].to = to[k];
		this.freeze();
		this.apply();
	}

	/** Puts the element exactly at `box` and keeps it there, for following a finger. */
	drag(box: Box): void {
		if (this.options.mode === "surface" && !this.hold) {
			this.release();
			this.measure();
			this.freeze();
		}
		this.stop();
		this.hold = true;
		this.done = null;
		const springs = {} as Springs;
		for (const k of BOX_KEYS) springs[k] = { x: box[k], v: 0, to: box[k] };
		this.springs = springs;
		this.fader = { x: 100, v: 0, to: 100 };
		this.apply();
	}

	/** Lets go after `drag`: springs home carrying the velocity of the throw. */
	fling(velocity: Partial<Box>): void {
		const s = this.springs;
		const rest = this.atRest;
		if (!s || !rest) return;
		for (const k of BOX_KEYS) {
			s[k].to = rest[k];
			s[k].v = velocity[k] ?? 0;
		}
		this.hold = false;
		this.running = true;
		track(this);
	}

	step(dt: number): void {
		const s = this.springs;
		if (!s) return;
		const constants = springConstants(config);
		for (const k of BOX_KEYS) stepSpring(s[k], constants, dt);
		const f = this.fader;
		if (f) stepSpring(f, constants, dt);
		if (BOX_KEYS.every((k) => isSettled(s[k])) && (!f || isSettled(f))) {
			this.finish();
		} else this.apply();
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
		const { mode } = this.options;
		if (mode === "surface") this.applySurface();
		else if (mode === "size") this.applySize();
		else this.applyTransform();
		this.options.onFrame?.(this);
	}

	private readRest(): void {
		const cs = getComputedStyle(this.el);
		const padLeft = px(cs.paddingLeft);
		const padTop = px(cs.paddingTop);
		this.rest = {
			padLeft,
			padTop,
			contentW:
				this.layout.w -
				padLeft -
				px(cs.paddingRight) -
				px(cs.borderLeftWidth) -
				px(cs.borderRightWidth),
			contentH:
				this.layout.h -
				padTop -
				px(cs.paddingBottom) -
				px(cs.borderTopWidth) -
				px(cs.borderBottomWidth),
			marginRight: px(cs.marginRight),
			marginBottom: px(cs.marginBottom),
			layout: LAYOUT_PROPS.map((p) => cs[p]),
		};
	}

	/** Pulls the content out of flow at its final size so the box can move alone. */
	private freeze(): void {
		const rest = this.rest;
		if (this.frozen || !rest) return;
		this.frozen = true;
		const { el, options } = this;
		this.scrollTop = el.scrollTop;
		this.surfaceStyles = SURFACE_PROPS.map((p) => el.style[p]);
		Object.assign(el.style, {
			boxSizing: "border-box",
			paddingTop: "0",
			paddingRight: "0",
			paddingBottom: "0",
			paddingLeft: "0",
			minWidth: "0",
			minHeight: "0",
			maxWidth: "none",
			maxHeight: "none",
			overflow: "hidden",
			contain: "layout paint",
		});
		el.scrollTop = 0;
		const inner = options.inner;
		if (!inner) return;
		this.innerCss = inner.style.cssText;
		const st = inner.style;
		LAYOUT_PROPS.forEach((p, i) => {
			st[p] = rest.layout[i];
		});
		Object.assign(st, {
			position: "absolute",
			left: `${rest.padLeft}px`,
			top: `${rest.padTop - this.scrollTop}px`,
			width: `${rest.contentW}px`,
			height: `${rest.contentH}px`,
			willChange: "opacity",
		});
	}

	private unfreeze(): void {
		if (!this.frozen) return;
		this.frozen = false;
		const st = this.el.style;
		SURFACE_PROPS.forEach((p, i) => {
			st[p] = this.surfaceStyles[i];
		});
		const inner = this.options.inner;
		if (inner) inner.style.cssText = this.innerCss;
		if (this.scrollTop) this.el.scrollTop = this.scrollTop;
	}

	private applySurface(): void {
		const st = this.el.style;
		const { x, y, w, h, r } = this.current();
		const width = Math.max(w, 1);
		const height = Math.max(h, 1);
		const { layout, rest } = this;
		st.transform = `translate(${x - layout.x}px, ${y - layout.y}px)`;
		st.width = `${width}px`;
		st.height = `${height}px`;
		// The space it would take at full size stays reserved, so a parent that
		// centers it can't move it as it shrinks.
		st.marginRight = `${(rest?.marginRight ?? 0) + layout.w - width}px`;
		st.marginBottom = `${(rest?.marginBottom ?? 0) + layout.h - height}px`;
		st.borderRadius = `${Math.max(0, Math.min(r, width / 2, height / 2))}px`;
		const inner = this.options.inner;
		const a = this.options.align?.();
		if (a && inner) {
			inner.style.transform = `translate(${a.x * (width - layout.w)}px, ${a.y * (height - layout.h)}px)`;
		}
		if (this.options.fade) {
			// The box arrives first, then the content inside it. Going home it stays
			// whole until it's back on the trigger, as a spring's tail is slow.
			const p = this.progress;
			this.whole ||= p >= 25;
			st.opacity = `${unit(
				this.still ? (p - 5) / 60 : this.whole ? (p - 1) / 5 : p / 25,
			)}`;
			if (inner) inner.style.opacity = `${unit((this.progress - 15) / 35)}`;
		}
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
