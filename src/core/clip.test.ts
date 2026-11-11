// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { clipOut, covering } from "./clip";

function box(left: number, top: number, width: number, height: number) {
	return () =>
		({
			left,
			top,
			width,
			height,
			right: left + width,
			bottom: top + height,
		}) as DOMRect;
}

function setup() {
	const trigger = document.createElement("button");
	trigger.getBoundingClientRect = box(100, 100, 100, 100);
	const bar = document.createElement("header");
	bar.style.position = "sticky";
	const link = document.createElement("a");
	bar.append(link);
	document.body.append(trigger, bar);
	return { trigger, bar, link };
}

function hits(...stack: Element[]) {
	document.elementsFromPoint = vi.fn(() => stack);
}

afterEach(() => {
	document.body.innerHTML = "";
});

describe("covering", () => {
	it("finds a sticky bar above the trigger, once", () => {
		const { trigger, bar } = setup();
		hits(bar, trigger, document.body);
		expect(covering(trigger)).toEqual([bar]);
	});

	it("finds a fixed bar", () => {
		const { trigger, bar } = setup();
		bar.style.position = "fixed";
		hits(bar, trigger);
		expect(covering(trigger)).toEqual([bar]);
	});

	it("walks up from a child to its bar", () => {
		const { trigger, bar, link } = setup();
		hits(link, bar, trigger);
		expect(covering(trigger)).toEqual([bar]);
	});

	it("ignores anything below the trigger", () => {
		const { trigger, bar } = setup();
		hits(trigger, bar);
		expect(covering(trigger)).toEqual([]);
	});

	it("ignores elements that aren't fixed or sticky", () => {
		const { trigger } = setup();
		const plain = document.createElement("div");
		document.body.append(plain);
		hits(plain, trigger);
		expect(covering(trigger)).toEqual([]);
	});

	it("ignores eclose's own layers", () => {
		const { trigger } = setup();
		const portal = document.createElement("div");
		portal.setAttribute("data-eclose", "");
		portal.style.position = "fixed";
		document.body.append(portal);
		hits(portal, trigger);
		expect(covering(trigger)).toEqual([]);
	});

	it("ignores a bar the trigger lives in", () => {
		const { trigger, bar, link } = setup();
		bar.append(trigger);
		hits(link, trigger, bar);
		expect(covering(trigger)).toEqual([]);
	});

	it("finds nothing if the trigger can't be hit", () => {
		const { trigger, bar } = setup();
		hits(bar);
		expect(covering(trigger)).toEqual([]);
	});

	it("only samples what's on screen", () => {
		const { trigger, bar } = setup();
		trigger.getBoundingClientRect = box(-50, -50, 100, 100);
		hits(bar, trigger);
		covering(trigger);
		for (const [x, y] of vi.mocked(document.elementsFromPoint).mock.calls) {
			expect(x).toBeGreaterThan(0);
			expect(y).toBeGreaterThan(0);
		}
	});
});

describe("clipOut", () => {
	it("cuts a hole relative to the element", () => {
		const el = document.createElement("div");
		el.getBoundingClientRect = box(10, 20, 0, 0);
		const bar = document.createElement("header");
		bar.getBoundingClientRect = box(10, 20, 100, 50);
		clipOut(el, [bar]);
		expect(el.style.clipPath).toContain("evenodd");
		expect(el.style.clipPath).toContain(
			"0px 0px, 100px 0px, 100px 50px, 0px 50px",
		);
	});

	it("clears the cut when there are no bars", () => {
		const el = document.createElement("div");
		el.style.clipPath = "circle(1px)";
		clipOut(el, []);
		expect(el.style.clipPath).toBe("");
	});

	it("tolerates a missing element", () => {
		expect(() => clipOut(null, [])).not.toThrow();
	});
});
