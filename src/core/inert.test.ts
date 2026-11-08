// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { inertOthers } from "./inert";

function page() {
	document.body.innerHTML = `
		<main id="main"></main>
		<div id="portal"><div id="side"></div><div id="dialog"></div></div>
		<aside id="aside" inert></aside>
	`;
	return (id: string) => document.getElementById(id) as HTMLElement;
}

const isInert = (el: Element) => el.hasAttribute("inert");

afterEach(() => {
	document.body.innerHTML = "";
});

describe("inertOthers", () => {
	it("covers siblings along the path to the body, not the path", () => {
		const $ = page();
		const undo = inertOthers($("dialog"));
		expect(isInert($("main"))).toBe(true);
		expect(isInert($("side"))).toBe(true);
		expect(isInert($("portal"))).toBe(false);
		expect(isInert($("dialog"))).toBe(false);
		undo();
		expect(isInert($("main"))).toBe(false);
		expect(isInert($("side"))).toBe(false);
	});

	it("leaves alone what was already inert", () => {
		const $ = page();
		inertOthers($("dialog"))();
		expect(isInert($("aside"))).toBe(true);
	});

	it("holds until the last dialog lets go, in any order", () => {
		const $ = page();
		const first = inertOthers($("dialog"));
		const second = inertOthers($("dialog"));
		first();
		expect(isInert($("main"))).toBe(true);
		second();
		expect(isInert($("main"))).toBe(false);
	});
});
