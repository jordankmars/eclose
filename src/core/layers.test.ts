// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { isTop, type Layer, pushLayer } from "./layers";

const cleanup: (() => void)[] = [];

function layer(modal = false) {
	const surface = document.createElement("div");
	const trigger = document.createElement("button");
	document.body.append(surface, trigger);
	const dismiss = vi.fn();
	const l: Layer = {
		surface: () => surface,
		trigger: () => trigger,
		modal,
		dismiss,
	};
	cleanup.push(pushLayer(l));
	return { l, surface, trigger, dismiss };
}

function press(target: Element, pointerType = "mouse") {
	const e = new Event("pointerdown", { bubbles: true });
	Object.assign(e, { pointerType });
	target.dispatchEvent(e);
}

const pressEscape = () =>
	document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));

afterEach(() => {
	for (const off of cleanup.splice(0)) off();
	document.body.innerHTML = "";
});

describe("layers", () => {
	it("sends Escape only to the top layer", () => {
		const a = layer();
		const b = layer();
		pressEscape();
		expect(b.dismiss).toHaveBeenCalledOnce();
		expect(a.dismiss).not.toHaveBeenCalled();
		expect(isTop(b.l)).toBe(true);
	});

	it("leaves Escape alone if something already handled it", () => {
		const a = layer();
		const e = new KeyboardEvent("keydown", {
			key: "Escape",
			cancelable: true,
		});
		e.preventDefault();
		document.dispatchEvent(e);
		expect(a.dismiss).not.toHaveBeenCalled();
	});

	it("does nothing for a press inside the top layer", () => {
		const a = layer();
		const b = layer();
		press(b.surface);
		expect(a.dismiss).not.toHaveBeenCalled();
		expect(b.dismiss).not.toHaveBeenCalled();
	});

	it("closes only what's above a pressed parent", () => {
		const a = layer();
		const b = layer();
		const c = layer();
		press(a.surface);
		expect(a.dismiss).not.toHaveBeenCalled();
		expect(c.dismiss).toHaveBeenCalledOnce();
		expect(b.dismiss).toHaveBeenCalledOnce();
	});

	it("counts the trigger as part of its layer", () => {
		const a = layer();
		press(a.trigger);
		expect(a.dismiss).not.toHaveBeenCalled();
	});

	it("closes down to the first modal on a page press", () => {
		const base = layer();
		const modal = layer(true);
		const pop = layer();
		press(document.body);
		expect(pop.dismiss).toHaveBeenCalledOnce();
		expect(modal.dismiss).toHaveBeenCalledOnce();
		expect(base.dismiss).not.toHaveBeenCalled();
	});

	it("waits for the click on touch, so a scroll doesn't dismiss", () => {
		const a = layer();
		press(document.body, "touch");
		expect(a.dismiss).not.toHaveBeenCalled();
		document.body.dispatchEvent(new MouseEvent("click", { bubbles: true }));
		expect(a.dismiss).toHaveBeenCalledOnce();
	});

	it("hands Tab to the top layer only", () => {
		const a = layer();
		const b = layer();
		a.l.tab = vi.fn();
		b.l.tab = vi.fn();
		document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
		expect(b.l.tab).toHaveBeenCalledOnce();
		expect(a.l.tab).not.toHaveBeenCalled();
	});

	it("forgets a removed layer", () => {
		const a = layer();
		for (const off of cleanup.splice(0)) off();
		pressEscape();
		expect(a.dismiss).not.toHaveBeenCalled();
	});
});
