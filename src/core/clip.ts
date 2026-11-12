// A dialog's layers sit above the whole page, including the sticky bars its
// trigger can scroll under, while its overlay has to dim those same bars. No
// z-index satisfies both, so the bars are cut out of the layers that travel.

const FAR = 1e6;

/**
 * The fixed or sticky elements painted over any part of the trigger. Hit testing
 * skips inert elements, so call this before the page is made inert.
 */
export function covering(trigger: Element): Element[] {
	const r = trigger.getBoundingClientRect();
	// Only what's on screen can be hit, and the part under a bar often isn't.
	const left = Math.max(r.left, 1);
	const top = Math.max(r.top, 1);
	const width = Math.min(r.right, innerWidth - 1) - left;
	const height = Math.min(r.bottom, innerHeight - 1) - top;
	const bars = new Set<Element>();
	// A three by three grid: its edges and middles.
	for (let n = 0; n < 9; n++) {
		const stack = document.elementsFromPoint(
			left + (width * (n % 3)) / 2,
			top + (height * ((n / 3) | 0)) / 2,
		);
		const above = stack.findIndex((el) => trigger.contains(el));
		for (let el of stack.slice(0, Math.max(above, 0))) {
			if (el.closest("[data-eclosion]")) continue;
			while (!/fixed|sticky/.test(getComputedStyle(el).position)) {
				if (!el.parentElement) break;
				el = el.parentElement;
			}
			if (el.parentElement && !el.contains(trigger)) bars.add(el);
		}
	}
	return [...bars];
}

const ring = (x: number, y: number, right: number, bottom: number) =>
	`${x}px ${y}px,${right}px ${y}px,${right}px ${bottom}px,${x}px ${bottom}px,${x}px ${y}px,${-FAR}px ${-FAR}px`;

/** Cuts a hole in `el` for each bar, or clears the cut when there are none. */
export function clipOut(el: HTMLElement | null, bars: Element[]): void {
	if (!el) return;
	const { left, top } = el.getBoundingClientRect();
	const holes = bars.map((bar) => {
		const r = bar.getBoundingClientRect();
		return ring(r.left - left, r.top - top, r.right - left, r.bottom - top);
	});
	el.style.clipPath = bars.length
		? `polygon(evenodd,${[ring(-FAR, -FAR, FAR, FAR), ...holes]})`
		: "";
}
