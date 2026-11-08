import { isReduced } from "./config";
import { pageBox, pageRect } from "./geometry";
import { Morph } from "./morph";

// A shared element travelling on its own. The destination sits inside a surface
// that fades and clips, so a copy does the flying in a layer above it, and the
// real element appears once the copy lands.

// Styles a stylesheet may have scoped under the destination's parents.
const COPIED = [
	"background",
	"borderRadius",
	"boxShadow",
	"objectFit",
] as const;

type Getter = () => HTMLElement | null;

function setHidden(el: HTMLElement | null, hidden: boolean): void {
	if (el) el.style.visibility = hidden ? "hidden" : "";
}

export class Flight {
	private source: Getter;
	private dest: Getter;
	private layer: Getter;
	private clone: HTMLElement | null = null;
	private morph: Morph | null = null;

	constructor(source: Getter, dest: Getter, layer: Getter) {
		this.source = source;
		this.dest = dest;
		this.layer = layer;
	}

	/** Takes up the open position with no motion. */
	settle(): void {
		setHidden(this.source(), true);
	}

	/**
	 * Flies toward the destination when `open`, otherwise back to the source.
	 * A flight already in the air bends toward the new target.
	 */
	fly(open: boolean, done: () => void): void {
		const source = this.source();
		const dest = this.dest();
		setHidden(source, true);
		if (isReduced() || !dest) {
			done();
			return;
		}
		const m = this.morph ?? this.launch(dest);
		setHidden(dest, true);
		if (!m) {
			setHidden(dest, false);
			done();
			return;
		}
		if (open) {
			const from = m.running
				? m.now()
				: source
					? pageBox(source)
					: pageBox(dest);
			m.release();
			m.measure();
			m.go(from, pageBox(dest), () => {
				setHidden(dest, false);
				this.land();
				done();
			});
		} else if (source?.isConnected) {
			m.to(pageBox(source), done);
		} else {
			// Nowhere to go back to, so it fades out where it is.
			m.options.fade = true;
			m.to(m.now(), done);
		}
	}

	/** Lands for good: the copy goes away and both originals come back. */
	destroy(): void {
		this.land();
		setHidden(this.source(), false);
		setHidden(this.dest(), false);
	}

	private land(): void {
		this.morph?.destroy();
		this.clone?.remove();
		this.morph = null;
		this.clone = null;
	}

	private launch(dest: HTMLElement): Morph | null {
		const layer = this.layer();
		if (!layer) return null;
		const clone = dest.cloneNode(true) as HTMLElement;
		clone.removeAttribute("id");
		for (const el of clone.querySelectorAll("[id]")) el.removeAttribute("id");
		const cs = getComputedStyle(dest);
		// Launched right on top of the destination, so that's where it's first seen.
		const at = pageRect(dest);
		const origin = pageRect(layer);
		for (const prop of COPIED) clone.style[prop] = cs[prop];
		Object.assign(clone.style, {
			position: "absolute",
			left: `${at.x - origin.x}px`,
			top: `${at.y - origin.y}px`,
			margin: "0",
			width: `${at.w}px`,
			height: `${at.h}px`,
			visibility: "visible",
		});
		layer.append(clone);
		this.clone = clone;
		this.morph = new Morph(clone, { mode: "surface" });
		return this.morph;
	}
}
