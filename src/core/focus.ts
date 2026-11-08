// Tab stays inside a dialog by wrapping at its two ends. Whatever is inert
// behind it can't take focus anyway, so only the edges need handling.

const TABBABLE =
	'a[href],button:not([disabled]),input:not([disabled]):not([type="hidden"]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"]),[contenteditable]:not([contenteditable="false"])';

export function tabbables(root: HTMLElement): HTMLElement[] {
	return [...root.querySelectorAll<HTMLElement>(TABBABLE)].filter(
		(el) =>
			!el.closest("[inert]") &&
			el.checkVisibility?.({ visibilityProperty: true }) !== false,
	);
}

/**
 * If this Tab press would leave `root`, returns the element at the other end
 * that focus should wrap to. Returns null when Tab should just do its job.
 */
export function tabEdge(
	e: Pick<KeyboardEvent, "shiftKey">,
	root: HTMLElement,
): HTMLElement | null {
	const items = tabbables(root);
	const first = items[0] ?? root;
	const last = items[items.length - 1] ?? root;
	const active = document.activeElement;
	if (!root.contains(active)) return first;
	if (e.shiftKey) return active === first || active === root ? last : null;
	return active === last ? first : null;
}
