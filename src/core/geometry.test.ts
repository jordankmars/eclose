import { describe, expect, it } from "vitest";
import { projection } from "./geometry";

const layout = { x: 100, y: 200, w: 300, h: 150 };

describe("projection", () => {
	it("is the identity when the box matches the layout", () => {
		expect(projection(layout, { ...layout, r: 0 })).toEqual({
			tx: 0,
			ty: 0,
			sx: 1,
			sy: 1,
			rx: 0,
			ry: 0,
		});
	});

	it("translates by the offset and scales per axis", () => {
		const p = projection(layout, { x: 40, y: 260, w: 150, h: 300, r: 0 });
		expect(p).toMatchObject({ tx: -60, ty: 60, sx: 0.5, sy: 2 });
	});

	it("divides the radius by the scale on each axis", () => {
		const p = projection(layout, { x: 0, y: 0, w: 150, h: 300, r: 20 });
		expect(p.rx).toBe(40);
		expect(p.ry).toBe(10);
	});

	it("clamps the radius to half the visible size", () => {
		const p = projection(layout, { x: 0, y: 0, w: 300, h: 40, r: 999 });
		expect(p.ry * p.sy).toBe(20);
		expect(p.rx * p.sx).toBe(20);
	});

	it("never collapses to a zero scale", () => {
		const p = projection(layout, { x: 0, y: 0, w: 0, h: -5, r: 0 });
		expect(p.sx).toBeGreaterThan(0);
		expect(p.sy).toBeGreaterThan(0);
	});

	it("copes with an element that has no layout size yet", () => {
		const p = projection({ x: 0, y: 0, w: 0, h: 0 }, { ...layout, r: 0 });
		expect(Number.isFinite(p.sx)).toBe(true);
		expect(Number.isFinite(p.sy)).toBe(true);
	});
});
