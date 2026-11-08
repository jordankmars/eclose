// Boxes are measured in page space (document coordinates, not viewport), so a
// spring keeps pointing at the same place while the page scrolls under it.

export interface Rect {
	x: number;
	y: number;
	w: number;
	h: number;
}

/** A rect plus its corner radius: everything a morph springs between. */
export interface Box extends Rect {
	r: number;
}

export const BOX_KEYS = ["x", "y", "w", "h", "r"] as const;

export function pageRect(el: Element): Rect {
	const r = el.getBoundingClientRect();
	return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height };
}

/** The element's top-left radius, clamped the way the browser would draw it. */
export function cornerOf(el: Element, rect: Rect): number {
	const r = Number.parseFloat(getComputedStyle(el).borderTopLeftRadius) || 0;
	return Math.min(r, rect.w / 2, rect.h / 2);
}

export function pageBox(el: Element): Box {
	const rect = pageRect(el);
	return { ...rect, r: cornerOf(el, rect) };
}

export interface Projection {
	tx: number;
	ty: number;
	sx: number;
	sy: number;
}

/**
 * The transform that makes an element laid out at `layout` appear at `box`.
 * Applied with a top-left transform origin.
 */
export function projection(layout: Rect, box: Box): Projection {
	const w = Math.max(box.w, 1);
	const h = Math.max(box.h, 1);
	return {
		tx: box.x - layout.x,
		ty: box.y - layout.y,
		sx: w / (layout.w || 1),
		sy: h / (layout.h || 1),
	};
}
