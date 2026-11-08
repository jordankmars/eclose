// Everything but one subtree goes inert. Dialogs can overlap, so each element
// counts how many want it inert and is only released by the last of them.

const holds = new Map<Element, number>();

/** Makes everything outside `keep` inert. Returns the function that undoes it. */
export function inertOthers(keep: Element): () => void {
	const held: Element[] = [];
	for (
		let node: Element | null = keep;
		node && node !== document.body;
		node = node.parentElement
	) {
		for (const sibling of node.parentElement?.children ?? []) {
			if (sibling === node) continue;
			const count = holds.get(sibling);
			// Inert before we got here means it isn't ours to release.
			if (!count && sibling.hasAttribute("inert")) continue;
			sibling.setAttribute("inert", "");
			holds.set(sibling, (count ?? 0) + 1);
			held.push(sibling);
		}
	}
	return () => {
		for (const el of held) {
			const count = (holds.get(el) ?? 1) - 1;
			if (count) {
				holds.set(el, count);
			} else {
				holds.delete(el);
				el.removeAttribute("inert");
			}
		}
	};
}
