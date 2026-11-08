import { describe, expect, it } from "vitest";
import {
	isSettled,
	type SpringState,
	springConstants,
	stepSpring,
} from "./spring";

const smooth = springConstants({ duration: 0.5, bounce: 0 });
const bouncy = springConstants({ duration: 0.55, bounce: 0.32 });

function run(s: SpringState, k: typeof smooth, seconds: number, fps = 60) {
	let peak = s.x;
	for (let t = 0; t < seconds; t += 1 / fps) {
		stepSpring(s, k, 1 / fps);
		peak = Math.max(peak, s.x);
	}
	return peak;
}

describe("springConstants", () => {
	it("gets stiffer as the duration gets shorter", () => {
		const fast = springConstants({ duration: 0.25, bounce: 0 });
		expect(fast.k).toBeGreaterThan(smooth.k);
	});

	it("loses damping as bounce goes up", () => {
		expect(bouncy.c / Math.sqrt(bouncy.k)).toBeLessThan(
			smooth.c / Math.sqrt(smooth.k),
		);
	});
});

describe("stepSpring", () => {
	it("settles on the target within about its duration", () => {
		const s = { x: 0, v: 0, to: 100 };
		run(s, smooth, 0.8);
		expect(isSettled(s)).toBe(true);
	});

	it("does not overshoot with no bounce", () => {
		const s = { x: 0, v: 0, to: 100 };
		expect(run(s, smooth, 1)).toBeLessThanOrEqual(100.1);
	});

	it("overshoots with bounce, then settles", () => {
		const s = { x: 0, v: 0, to: 100 };
		expect(run(s, bouncy, 0.4)).toBeGreaterThan(101);
		run(s, bouncy, 1.5);
		expect(isSettled(s)).toBe(true);
	});

	it("carries existing velocity when the target moves", () => {
		const s = { x: 50, v: 800, to: 100 };
		s.to = 0;
		stepSpring(s, smooth, 1 / 60);
		expect(s.x).toBeGreaterThan(50);
	});

	it("stays stable through a very long frame", () => {
		const s = { x: 0, v: 0, to: 100 };
		stepSpring(s, smooth, 1);
		expect(Number.isFinite(s.x)).toBe(true);
		expect(Math.abs(s.x - 100)).toBeLessThan(1);
	});

	it("ignores zero and negative time", () => {
		const s = { x: 3, v: 2, to: 10 };
		stepSpring(s, smooth, 0);
		stepSpring(s, smooth, -1);
		expect(s).toEqual({ x: 3, v: 2, to: 10 });
	});
});
