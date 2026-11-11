// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { alignment, place, watch } from "./anchor";

const view = { x: 0, y: 0, w: 1000, h: 800 };
const size = { w: 200, h: 300 };

describe("place", () => {
	it("rests on top of the trigger when there's room", () => {
		const trigger = { x: 100, y: 100, w: 80, h: 32 };
		expect(place(trigger, size, view)).toEqual({ x: 100, y: 100 });
	});

	it("lines up the far edge when it would overflow", () => {
		const trigger = { x: 900, y: 700, w: 80, h: 32 };
		expect(place(trigger, size, view)).toEqual({ x: 780, y: 432 });
	});

	it("clamps into the viewport when neither edge fits", () => {
		const trigger = { x: -50, y: 10, w: 10, h: 10 };
		expect(place(trigger, size, view).x).toBe(8);
	});

	it("pins oversized content to the start", () => {
		const trigger = { x: 500, y: 500, w: 80, h: 32 };
		expect(place(trigger, { w: 1200, h: 900 }, view)).toEqual({ x: 8, y: 8 });
	});

	it("works in page coordinates when the page is scrolled", () => {
		const scrolled = { ...view, y: 2000 };
		const trigger = { x: 100, y: 2700, w: 80, h: 32 };
		expect(place(trigger, size, scrolled).y).toBe(2432);
	});

	it("shares a center with the trigger", () => {
		const trigger = { x: 400, y: 400, w: 80, h: 32 };
		expect(place(trigger, size, view, { x: 0.5, y: 0.5 })).toEqual({
			x: 340,
			y: 266,
		});
	});

	it("shares a far corner with the trigger", () => {
		const trigger = { x: 400, y: 400, w: 80, h: 32 };
		expect(place(trigger, size, view, { x: 1, y: 1 })).toEqual({
			x: 280,
			y: 132,
		});
	});

	it("flips a far origin to the near edge when it would overflow", () => {
		const trigger = { x: 20, y: 20, w: 80, h: 32 };
		expect(place(trigger, size, view, { x: 1, y: 1 })).toEqual({
			x: 20,
			y: 20,
		});
	});

	it("clamps a centered origin, which has no other edge to try", () => {
		const trigger = { x: 20, y: 400, w: 80, h: 32 };
		expect(place(trigger, size, view, { x: 0.5, y: 0.5 }).x).toBe(8);
	});
});

describe("alignment", () => {
	it.each([
		["center", 0.5, 0.5],
		["top", 0.5, 0],
		["right", 1, 0.5],
		["bottom", 0.5, 1],
		["left", 0, 0.5],
		["top-left", 0, 0],
		["top-right", 1, 0],
		["bottom-left", 0, 1],
		["bottom-right", 1, 1],
	] as const)("reads %s", (origin, x, y) => {
		expect(alignment(origin)).toEqual({ x, y });
	});

	it("defaults to the center", () => {
		expect(alignment()).toEqual({ x: 0.5, y: 0.5 });
	});
});

describe("watch", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	function setup() {
		const box = document.createElement("div");
		const trigger = document.createElement("button");
		const other = document.createElement("div");
		box.append(trigger);
		document.body.append(box, other);
		const onChange = vi.fn();
		return { box, other, onChange, off: watch(() => trigger, onChange) };
	}

	it("reacts to a scroller carrying the trigger", () => {
		const { box, onChange, off } = setup();
		box.dispatchEvent(new Event("scroll"));
		expect(onChange).toHaveBeenCalledOnce();
		off();
	});

	it("ignores unrelated scrollers", () => {
		const { other, onChange, off } = setup();
		other.dispatchEvent(new Event("scroll"));
		expect(onChange).not.toHaveBeenCalled();
		off();
	});

	it("reacts to a resize, and stops when removed", () => {
		const { onChange, off } = setup();
		dispatchEvent(new Event("resize"));
		expect(onChange).toHaveBeenCalledOnce();
		off();
		dispatchEvent(new Event("resize"));
		expect(onChange).toHaveBeenCalledOnce();
	});
});
