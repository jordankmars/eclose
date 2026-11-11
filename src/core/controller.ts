import type { Flight } from "./flight";
import { type Box, pageBox } from "./geometry";
import type { Morph } from "./morph";

// The open and close sequence, separate from any framework. Elements are read
// through getters because a framework may not have mounted them yet.

export type Phase = "closed" | "opening" | "open" | "closing";

export interface ControllerOptions {
	morph: () => Morph | null;
	/** Shows or hides the content. Must have applied by the time it returns. */
	commit: (open: boolean) => void;
	/** Gets focus back on close. */
	trigger: () => HTMLElement | null;
	/** Pressing outside this dismisses. */
	surface: () => HTMLElement | null;
	/**
	 * The element the content grows out of and returns to, for content that
	 * lives somewhere else on the page. Leave it out when the content opens in
	 * place.
	 */
	source?: () => HTMLElement | null;
	/** Gets focus on open. */
	initialFocus?: () => HTMLElement | null;
	onPhase?: (phase: Phase) => void;
	/** Set false if something else handles Escape and outside presses. */
	dismiss?: false;
	/** Puts the content in its resting place, just before it's measured. */
	layout?: () => void;
	/**
	 * Shared elements that travel on their own, read each time it opens from
	 * closed. They fly above the surface as it grows from the source.
	 */
	flights?: () => Flight[];
	/** Runs as the surface sets off, once its resting place is measured. */
	onLaunch?: () => void;
}

/** Runs `then` once it has been called `count` times. */
function latch(count: number, then: () => void): () => void {
	let left = count;
	return () => {
		if (--left === 0) then();
	};
}

/** Slightly smaller and on the same center, for fading out with nowhere to go. */
function shrunk({ x, y, w, h, r }: Box): Box {
	return { x: x + w * 0.05, y: y + h * 0.05, w: w * 0.9, h: h * 0.9, r };
}

export class Controller {
	phase: Phase = "closed";
	private options: ControllerOptions;
	private flying: Flight[] = [];

	constructor(options: ControllerOptions) {
		this.options = options;
	}

	open(): void {
		if (this.phase === "opening" || this.phase === "open") return;
		const { morph, source, commit, initialFocus, layout, flights } =
			this.options;
		const m = morph();
		if (!m) return;

		const wasClosed = this.phase === "closed";
		if (wasClosed) this.flying = flights?.() ?? [];
		const shared = source !== undefined;
		const origin = shared && wasClosed ? source() : null;
		const from = origin ? pageBox(origin) : m.now();
		m.release();
		if (!shared || wasClosed) commit(true);
		if (wasClosed) this.listen();
		layout?.();

		// Measuring flushes layout, which gives CSS fades a state to start from.
		const to = m.measure();
		this.set("opening");
		const done = latch(1 + this.flying.length, () => this.set("open"));
		for (const f of this.flying) f.fly(true, done);
		m.go(from, to, done);
		this.options.onLaunch?.();
		initialFocus?.()?.focus({ preventScroll: true });
	}

	close(): void {
		if (this.phase === "closing" || this.phase === "closed") return;
		const { morph, source, commit } = this.options;
		const m = morph();
		if (!m) return;

		this.set("closing");
		if (source) {
			const done = latch(1 + this.flying.length, () => this.land());
			for (const f of this.flying) f.fly(false, done);
			const origin = source();
			if (origin) {
				m.to(pageBox(origin), done);
				this.options.onLaunch?.();
			} else if (m.options.mode === "surface") {
				m.to(shrunk(m.now()), done);
			} else {
				// Nowhere to fly back to.
				m.destroy();
				this.land();
			}
			return;
		}
		const from = m.now();
		m.release();
		commit(false);
		this.restoreFocus();
		m.go(from, m.measure(), () => this.settleClosed());
	}

	/** Starts out open, with no motion. */
	settle(): void {
		if (this.phase !== "closed") return;
		this.flying = this.options.flights?.() ?? [];
		for (const f of this.flying) f.settle();
		this.listen();
		this.set("open");
	}

	/** Drops back to closed at once, without animating or moving focus. */
	reset(): void {
		this.destroy();
		if (this.phase !== "closed") this.set("closed");
	}

	/** Removes the listeners. The morph belongs to whoever created it. */
	destroy(): void {
		this.unlisten();
		this.dropFlights();
	}

	private dropFlights(): void {
		for (const f of this.flying) f.destroy();
		this.flying = [];
	}

	private land(): void {
		this.options.commit(false);
		this.dropFlights();
		this.restoreFocus();
		this.settleClosed();
	}

	private settleClosed(): void {
		this.unlisten();
		this.set("closed");
	}

	private set(phase: Phase): void {
		this.phase = phase;
		this.options.onPhase?.(phase);
	}

	// Only take focus back if nothing else has claimed it in the meantime.
	private restoreFocus(): void {
		const active = document.activeElement;
		const unclaimed =
			!active ||
			active === document.body ||
			this.options.surface()?.contains(active);
		if (unclaimed) this.options.trigger()?.focus({ preventScroll: true });
	}

	private onKeyDown = (e: KeyboardEvent): void => {
		if (e.key === "Escape") this.close();
	};

	private onPointerDown = (e: PointerEvent): void => {
		const target = e.target as Node;
		if (this.options.surface()?.contains(target)) return;
		if (this.options.trigger()?.contains(target)) return;
		this.close();
	};

	private listen(): void {
		if (this.options.dismiss === false) return;
		document.addEventListener("keydown", this.onKeyDown);
		document.addEventListener("pointerdown", this.onPointerDown);
	}

	private unlisten(): void {
		document.removeEventListener("keydown", this.onKeyDown);
		document.removeEventListener("pointerdown", this.onPointerDown);
	}
}
