// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { Morph } from "./morph";
import { arbitrate, dismisses, releaseVelocity, swipe } from "./swipe";

describe("arbitrate", () => {
	it("waits for enough movement to judge", () => {
		expect(arbitrate(1, 3, null)).toBe("wait");
	});
	it("claims a pull down with nothing to scroll", () => {
		expect(arbitrate(0, 10, null)).toBe("claim");
	});
	it("claims a pull down from the top of a scroller", () => {
		expect(arbitrate(0, 10, 0)).toBe("claim");
		expect(arbitrate(0, 10, -8)).toBe("claim");
	});
	it("leaves a pull down to a scroller with room above", () => {
		expect(arbitrate(0, 10, 40)).toBe("abort");
	});
	it("leaves upward and sideways gestures alone", () => {
		expect(arbitrate(0, -10, null)).toBe("abort");
		expect(arbitrate(10, 2, null)).toBe("abort");
	});
});

describe("releaseVelocity", () => {
	it("reads only the end of the gesture", () => {
		const samples = [
			{ t: 0, y: 0 },
			{ t: 400, y: 0 },
			{ t: 450, y: 50 },
			{ t: 500, y: 100 },
		];
		expect(releaseVelocity(samples)).toBeCloseTo(1000);
	});
	it("is zero with nothing to measure", () => {
		expect(releaseVelocity([])).toBe(0);
		expect(releaseVelocity([{ t: 1, y: 1 }])).toBe(0);
	});
});

describe("dismisses", () => {
	it("needs distance when released slowly", () => {
		expect(dismisses(50, 0, 800)).toBe(false);
		expect(dismisses(130, 0, 800)).toBe(true);
	});
	it("uses a share of the height on short content", () => {
		expect(dismisses(70, 0, 200)).toBe(true);
	});
	it("accepts a short, fast throw", () => {
		expect(dismisses(40, 800, 800)).toBe(true);
	});
	it("doesn't let an upward flick cancel a long drag", () => {
		expect(dismisses(130, -2000, 800)).toBe(true);
	});
});

function finger(type: string, target: Element, y: number, t = 0) {
	const e = new Event(type, { bubbles: true, cancelable: true });
	Object.defineProperty(e, "touches", {
		value: type === "touchend" ? [] : [{ clientX: 0, clientY: y }],
	});
	Object.defineProperty(e, "timeStamp", { value: t });
	target.dispatchEvent(e);
	return e;
}

describe("swipe", () => {
	afterEach(() => {
		document.body.innerHTML = "";
	});

	function setup(enabled = true) {
		const el = document.createElement("div");
		el.getBoundingClientRect = () =>
			({ left: 0, top: 0, width: 300, height: 800 }) as DOMRect;
		document.body.append(el);
		const morph = new Morph(el, { mode: "surface" });
		const dismiss = vi.fn();
		const off = swipe(el, {
			morph: () => morph,
			enabled: () => enabled,
			dismiss,
		});
		return { el, morph, dismiss, off };
	}

	it("follows the finger after claiming the gesture", () => {
		const { el, off, morph } = setup();
		finger("touchstart", el, 100);
		finger("touchmove", el, 110, 10);
		const e = finger("touchmove", el, 150, 20);
		expect(e.defaultPrevented).toBe(true);
		expect(el.style.transform).toBe("translate(0px, 40px)");
		off();
		morph.destroy();
	});

	it("dismisses a release past the line", () => {
		const { el, dismiss, off, morph } = setup();
		finger("touchstart", el, 100);
		finger("touchmove", el, 110, 10);
		finger("touchmove", el, 300, 1000);
		finger("touchend", el, 300, 2000);
		expect(dismiss).toHaveBeenCalledOnce();
		off();
		morph.destroy();
	});

	it("springs back from a short, slow drag", () => {
		const { el, dismiss, off, morph } = setup();
		finger("touchstart", el, 100);
		finger("touchmove", el, 110, 10);
		finger("touchmove", el, 130, 1000);
		finger("touchmove", el, 130, 2000);
		finger("touchend", el, 130, 3000);
		expect(dismiss).not.toHaveBeenCalled();
		expect(morph.running).toBe(true);
		off();
		morph.destroy();
	});

	it("does nothing when not enabled", () => {
		const { el, dismiss, off } = setup(false);
		finger("touchstart", el, 100);
		const e = finger("touchmove", el, 300, 10);
		finger("touchend", el, 300, 20);
		expect(e.defaultPrevented).toBe(false);
		expect(dismiss).not.toHaveBeenCalled();
		off();
	});

	it("leaves opted-out elements to themselves", () => {
		const { el, off } = setup();
		const slider = document.createElement("div");
		slider.setAttribute("data-eclosion-no-swipe", "");
		el.append(slider);
		finger("touchstart", slider, 100);
		expect(finger("touchmove", slider, 150, 10).defaultPrevented).toBe(false);
		off();
	});
});
