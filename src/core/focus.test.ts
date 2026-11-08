// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { tabbables, tabEdge } from "./focus";

function dialog(html: string) {
	const root = document.createElement("div");
	root.tabIndex = -1;
	root.innerHTML = html;
	document.body.append(root);
	return root;
}

const byId = (id: string) => document.getElementById(id) as HTMLElement;

afterEach(() => {
	document.body.innerHTML = "";
});

describe("tabbables", () => {
	it("skips disabled, inert and negative tabindex elements", () => {
		const root = dialog(`
			<button id="a"></button>
			<button disabled></button>
			<input type="hidden" />
			<div tabindex="-1"></div>
			<div inert><button></button></div>
			<a href="#" id="b"></a>
		`);
		expect(tabbables(root).map((el) => el.id)).toEqual(["a", "b"]);
	});
});

describe("tabEdge", () => {
	const html = '<button id="a"></button><button id="b"></button>';

	it("wraps forward from the last element", () => {
		const root = dialog(html);
		byId("b").focus();
		expect(tabEdge({ shiftKey: false }, root)).toBe(byId("a"));
	});

	it("wraps backward from the first element", () => {
		const root = dialog(html);
		byId("a").focus();
		expect(tabEdge({ shiftKey: true }, root)).toBe(byId("b"));
	});

	it("wraps backward from the dialog itself", () => {
		const root = dialog(html);
		root.focus();
		expect(tabEdge({ shiftKey: true }, root)).toBe(byId("b"));
	});

	it("leaves a Tab in the middle alone", () => {
		const root = dialog(html);
		byId("a").focus();
		expect(tabEdge({ shiftKey: false }, root)).toBeNull();
	});

	it("pulls stray focus back in", () => {
		const root = dialog(html);
		expect(tabEdge({ shiftKey: false }, root)).toBe(byId("a"));
	});

	it("stays on the dialog when nothing inside can take focus", () => {
		const root = dialog("<p></p>");
		root.focus();
		expect(tabEdge({ shiftKey: false }, root)).toBe(root);
	});
});
