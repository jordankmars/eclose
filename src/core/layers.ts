// Every open eclose on the page, oldest first. One set of document listeners
// serves them all, so a nested dialog can decide what a key or a press means
// for the layers around it.

export interface Layer {
	surface: () => HTMLElement | null;
	trigger: () => HTMLElement | null;
	/** A modal stops outside presses from reaching the layers beneath it. */
	modal: boolean;
	/** Asked to close: by Escape, or a press outside. */
	dismiss: () => void;
	/** Tab was pressed while this layer is on top. */
	tab?: (e: KeyboardEvent) => void;
}

const stack: Layer[] = [];

function holds(layer: Layer, target: Node): boolean {
	return !!(
		layer.surface()?.contains(target) || layer.trigger()?.contains(target)
	);
}

export function isTop(layer: Layer): boolean {
	return stack[stack.length - 1] === layer;
}

function onKeyDown(e: KeyboardEvent): void {
	if (e.defaultPrevented) return;
	const top = stack[stack.length - 1];
	if (e.key === "Escape") top?.dismiss();
	else if (e.key === "Tab") top?.tab?.(e);
}

/**
 * The layer pressed on stays open, and everything stacked above it closes. A
 * press on the page closes layers from the top down, stopping at a modal, which
 * only closes once it's on top.
 */
function pressed(target: Node): void {
	for (let i = stack.length - 1; i >= 0; i--) {
		if (!holds(stack[i], target)) continue;
		for (const layer of stack.slice(i + 1).reverse()) layer.dismiss();
		return;
	}
	for (const layer of [...stack].reverse()) {
		layer.dismiss();
		if (layer.modal) return;
	}
}

// A finger going down may be the start of a scroll, so touch waits for the click.
let touching = false;

function onPointerDown(e: PointerEvent): void {
	touching = e.pointerType === "touch";
	if (!touching) pressed(e.target as Node);
}

function onClick(e: MouseEvent): void {
	if (touching) pressed(e.target as Node);
	touching = false;
}

function setListeners(method: "addEventListener" | "removeEventListener") {
	document[method]("keydown", onKeyDown as EventListener);
	document[method]("pointerdown", onPointerDown as EventListener);
	document[method]("click", onClick as EventListener);
}

/** Adds a layer on top of the stack. Returns the function that removes it. */
export function pushLayer(layer: Layer): () => void {
	if (!stack.length) setListeners("addEventListener");
	stack.push(layer);
	return () => {
		const i = stack.indexOf(layer);
		if (i < 0) return;
		stack.splice(i, 1);
		if (!stack.length) setListeners("removeEventListener");
	};
}
