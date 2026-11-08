import { pageBox } from "./geometry";
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
}

export class Controller {
	phase: Phase = "closed";
	private options: ControllerOptions;

	constructor(options: ControllerOptions) {
		this.options = options;
	}

	open(): void {
		if (this.phase === "opening" || this.phase === "open") return;
		const { morph, source, commit, initialFocus } = this.options;
		const m = morph();
		if (!m) return;

		const wasClosed = this.phase === "closed";
		const shared = source !== undefined;
		const origin = shared && wasClosed ? source() : null;
		const from = origin ? pageBox(origin) : m.now();
		m.release();
		if (!shared || wasClosed) commit(true);
		if (wasClosed) this.listen();

		// Measuring flushes layout, which gives CSS fades a state to start from.
		const to = m.measure();
		this.set("opening");
		m.go(from, to, () => this.set("open"));
		initialFocus?.()?.focus({ preventScroll: true });
	}

	close(): void {
		if (this.phase === "closing" || this.phase === "closed") return;
		const { morph, source, commit } = this.options;
		const m = morph();
		if (!m) return;

		this.set("closing");
		if (source) {
			const origin = source();
			if (origin) {
				m.to(pageBox(origin), () => this.land());
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

	/** Removes the listeners. The morph belongs to whoever created it. */
	destroy(): void {
		this.unlisten();
	}

	private land(): void {
		this.options.commit(false);
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
		document.addEventListener("keydown", this.onKeyDown);
		document.addEventListener("pointerdown", this.onPointerDown);
	}

	private unlisten(): void {
		document.removeEventListener("keydown", this.onKeyDown);
		document.removeEventListener("pointerdown", this.onPointerDown);
	}
}
