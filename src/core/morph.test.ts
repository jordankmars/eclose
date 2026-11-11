// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { configure } from "./config";
import type { Box } from "./geometry";
import { Morph, type MorphOptions } from "./morph";

const REST = { x: 100, y: 200, w: 300, h: 400 };

function surface(fade = false, align?: MorphOptions["align"]) {
	const el = document.createElement("div");
	el.style.paddingLeft = "12px";
	el.style.paddingTop = "8px";
	el.getBoundingClientRect = () =>
		({
			left: REST.x,
			top: REST.y,
			width: REST.w,
			height: REST.h,
		}) as DOMRect;
	const inner = document.createElement("div");
	inner.style.display = "contents";
	el.append(inner);
	document.body.append(el);
	return {
		el,
		inner,
		m: new Morph(el, { mode: "surface", inner, fade, align }),
	};
}

const box = (x: number, y: number, w: number, h: number): Box => ({
	x,
	y,
	w,
	h,
	r: 0,
});

afterEach(() => {
	document.body.innerHTML = "";
	configure({ reduced: null });
});

describe("surface mode", () => {
	it("draws real size and position, without scale", () => {
		const { el, m } = surface();
		const to = m.measure();
		m.go(box(10, 20, 50, 60), to);
		expect(el.style.transform).toBe("translate(-90px, -180px)");
		expect(el.style.width).toBe("50px");
		expect(el.style.height).toBe("60px");
		m.destroy();
	});

	it("keeps its full-size footprint while smaller", () => {
		const { el, m } = surface();
		m.go(box(10, 20, 50, 60), m.measure());
		expect(el.style.marginRight).toBe("250px");
		expect(el.style.marginBottom).toBe("340px");
		m.destroy();
	});

	it("freezes the content at its final size, past the padding", () => {
		const { inner, m } = surface();
		m.go(box(0, 0, 10, 10), m.measure());
		expect(inner.style.position).toBe("absolute");
		expect(inner.style.left).toBe("12px");
		expect(inner.style.top).toBe("8px");
		expect(inner.style.width).toBe("288px");
		expect(inner.style.height).toBe("392px");
		m.destroy();
	});

	it("keeps the content lined up with its alignment point", () => {
		const { inner, m } = surface(false, () => ({ x: 0.5, y: 1 }));
		m.go(box(0, 0, 100, 100), m.measure());
		expect(inner.style.left).toBe("-88px");
		expect(inner.style.top).toBe("-292px");
		m.destroy();
	});

	it("hands everything back on release", () => {
		const { el, inner, m } = surface();
		m.go(box(0, 0, 10, 10), m.measure());
		m.release();
		expect(el.style.width).toBe("");
		expect(el.style.transform).toBe("");
		expect(el.style.overflow).toBe("");
		expect(el.style.marginRight).toBe("");
		expect(el.style.paddingLeft).toBe("12px");
		expect(inner.style.cssText).toBe("display: contents;");
		m.destroy();
	});

	it("puts back inline styles it had to overwrite", () => {
		const { el, m } = surface();
		el.style.width = "420px";
		el.style.borderRadius = "16px";
		m.go(box(0, 0, 10, 10), m.measure());
		expect(el.style.paddingLeft).toBe("0px");
		expect(el.style.width).toBe("10px");
		m.destroy();
		expect(el.style.width).toBe("420px");
		expect(el.style.borderRadius).toBe("16px");
		expect(el.style.paddingLeft).toBe("12px");
	});

	it("reverses the fade when interrupted, rather than restarting it", () => {
		const { m } = surface(true);
		m.go(box(0, 0, 10, 10), m.measure());
		expect(m.progress).toBe(0);
		for (let i = 0; i < 6; i++) m.step(1 / 60);
		const mid = m.progress;
		expect(mid).toBeGreaterThan(0);
		m.to(box(0, 0, 10, 10));
		expect(m.progress).toBeCloseTo(mid);
		for (let i = 0; i < 40; i++) m.step(1 / 60);
		expect(m.progress).toBeLessThan(mid);
		m.destroy();
	});

	it("shows the box before the content", () => {
		const { el, inner, m } = surface(true);
		m.go(box(0, 0, 10, 10), m.measure());
		expect(el.style.opacity).toBe("0");
		expect(inner.style.opacity).toBe("0");
		while (m.progress < 30) m.step(1 / 240);
		expect(el.style.opacity).toBe("1");
		expect(Number(inner.style.opacity)).toBeLessThan(1);
		m.destroy();
	});

	it("still animates reduced motion: no travel, an async fade", () => {
		configure({ reduced: true });
		const { el, m } = surface(true);
		let done = false;
		m.go(box(0, 0, 10, 10), m.measure(), () => {
			done = true;
		});
		expect(done).toBe(false);
		expect(el.style.width).toBe("300px");
		expect(el.style.transform).toBe("translate(0px)");
		for (let i = 0; i < 120 && !done; i++) m.step(1 / 60);
		expect(done).toBe(true);
	});

	it("fades out in place when closed under reduced motion", () => {
		configure({ reduced: true });
		const { el, m } = surface(true);
		m.go(box(0, 0, 10, 10), m.measure());
		for (let i = 0; i < 120 && m.running; i++) m.step(1 / 60);
		let done = false;
		m.to(box(0, 0, 10, 10), () => {
			done = true;
		});
		expect(done).toBe(false);
		expect(el.style.width).toBe("300px");
		for (let i = 0; i < 120 && !done; i++) m.step(1 / 60);
		expect(done).toBe(true);
		expect(Number(el.style.opacity)).toBeLessThan(0.02);
	});

	it("leaves the other modes alone", () => {
		const el = document.createElement("div");
		const m = new Morph(el);
		m.measure();
		m.go(box(0, 0, 10, 10), box(0, 0, 10, 10));
		expect(m.progress).toBe(100);
		m.destroy();
	});
});

describe("retarget", () => {
	it("heads somewhere new without losing speed or the callback", () => {
		const { el, m } = surface();
		let done = false;
		m.go(box(0, 0, 10, 10), m.measure(), () => {
			done = true;
		});
		for (let i = 0; i < 5; i++) m.step(1 / 60);
		const before = m.current();
		m.retarget(box(500, 500, 300, 400));
		expect(m.current()).toEqual(before);
		expect(Number.parseFloat(el.style.width)).toBeCloseTo(before.w, 2);
		for (let i = 0; i < 300 && !done; i++) m.step(1 / 60);
		expect(done).toBe(true);
	});

	it("reads the new layout when given no target", () => {
		const { el, m } = surface();
		m.go(box(0, 0, 10, 10), m.measure());
		REST.w = 500;
		m.retarget();
		REST.w = 300;
		for (let i = 0; i < 300 && m.running; i++) m.step(1 / 60);
		expect(m.running).toBe(false);
		expect(el.style.width).toBe("");
	});

	it("does nothing when nothing is moving", () => {
		const { el, m } = surface();
		m.measure();
		m.retarget(box(500, 500, 10, 10));
		expect(el.style.transform).toBe("");
	});
});

describe("drag and fling", () => {
	it("follows a box exactly", () => {
		const { el, m } = surface();
		const rest = m.measure();
		m.drag({ ...rest, y: rest.y + 40 });
		expect(el.style.transform).toBe("translate(0px, 40px)");
		expect(el.style.width).toBe("300px");
		expect(m.running).toBe(false);
		expect(m.now().y).toBe(rest.y + 40);
		m.destroy();
	});

	it("reports being held while dragged, and not once let go", () => {
		const { m } = surface();
		const rest = m.measure();
		expect(m.held).toBe(false);
		m.drag(rest);
		expect(m.held).toBe(true);
		m.fling({});
		expect(m.held).toBe(false);
		m.destroy();
	});

	it("carries a throw's velocity on the way home", () => {
		const { m } = surface();
		const rest = m.measure();
		m.drag({ ...rest, y: rest.y + 40 });
		m.fling({ y: 2000 });
		m.step(1 / 60);
		expect(m.current().y).toBeGreaterThan(rest.y + 40);
		for (let i = 0; i < 300 && m.running; i++) m.step(1 / 60);
		expect(m.running).toBe(false);
		m.destroy();
	});

	it("lets a close take over the live spring", () => {
		const { m } = surface();
		const rest = m.measure();
		m.drag({ ...rest, y: rest.y + 40 });
		m.fling({ y: 2000 });
		m.step(1 / 60);
		const at = m.current();
		m.to(box(0, 0, 10, 10));
		expect(m.current()).toEqual(at);
		m.step(1 / 60);
		// From a standstill this spring would drop about 14px in one frame. The
		// downward throw is still fighting it.
		expect(at.y - m.current().y).toBeLessThan(10);
		m.destroy();
	});
});
