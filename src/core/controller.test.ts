// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { configure } from "./config";
import { Controller, type ControllerOptions, type Phase } from "./controller";
import { Flight } from "./flight";
import { Morph } from "./morph";

function setup(extra: Partial<ControllerOptions> = {}) {
	const surface = document.createElement("div");
	const trigger = document.createElement("button");
	const flightLayer = document.createElement("div");
	surface.getBoundingClientRect = () =>
		({ left: 100, top: 100, width: 300, height: 400 }) as DOMRect;
	trigger.getBoundingClientRect = () =>
		({ left: 10, top: 10, width: 80, height: 32 }) as DOMRect;
	document.body.append(trigger, surface, flightLayer);
	const morph = new Morph(surface, { mode: "surface", fade: true });
	const phases: Phase[] = [];
	const c = new Controller({
		morph: () => morph,
		commit: () => {},
		trigger: () => trigger,
		surface: () => surface,
		source: () => trigger,
		dismiss: false,
		onPhase: (p) => phases.push(p),
		...extra,
	});
	return { c, morph, surface, trigger, flightLayer, phases };
}

function run(m: Morph) {
	for (let i = 0; i < 600 && m.running; i++) m.step(1 / 60);
}

afterEach(() => {
	document.body.innerHTML = "";
	configure({ reduced: null });
});

describe("Controller for adapters", () => {
	it("runs the layout hook after release and before measuring", () => {
		const order: string[] = [];
		const { c, morph } = setup({ layout: () => order.push("layout") });
		const measure = morph.measure.bind(morph);
		morph.measure = () => {
			order.push("measure");
			return measure();
		};
		c.open();
		expect(order).toEqual(["layout", "measure"]);
		morph.destroy();
	});

	it("opens from the trigger and returns to it", () => {
		const { c, morph, surface, phases } = setup();
		c.open();
		expect(surface.style.width).toBe("80px");
		run(morph);
		expect(c.phase).toBe("open");
		expect(surface.style.width).toBe("");
		c.close();
		run(morph);
		expect(phases).toEqual(["opening", "open", "closing", "closed"]);
	});

	it("bends in both directions when interrupted", () => {
		const { c, morph, phases } = setup();
		c.open();
		morph.step(1 / 60);
		const at = morph.current();
		c.close();
		expect(morph.current()).toEqual(at);
		morph.step(1 / 60);
		c.open();
		run(morph);
		expect(c.phase).toBe("open");
		expect(phases).toEqual(["opening", "closing", "opening", "open"]);
	});

	it("ignores outside presses when dismissal is handled elsewhere", () => {
		const { c, morph } = setup();
		c.open();
		run(morph);
		document.body.dispatchEvent(new Event("pointerdown", { bubbles: true }));
		expect(c.phase).toBe("open");
	});

	it("shrinks and fades in place if the trigger is gone", () => {
		const { c, morph, surface } = setup({ source: () => null });
		c.open();
		run(morph);
		c.close();
		expect(c.phase).toBe("closing");
		morph.step(1 / 60);
		expect(Number.parseFloat(surface.style.width)).toBeLessThan(300);
		expect(Number.parseFloat(surface.style.width)).toBeGreaterThan(260);
		run(morph);
		expect(c.phase).toBe("closed");
	});

	it("starts open without animating", () => {
		const { c, morph, surface, phases } = setup();
		c.settle();
		expect(c.phase).toBe("open");
		expect(morph.running).toBe(false);
		expect(surface.style.width).toBe("");
		expect(phases).toEqual(["open"]);
	});

	it("resets to closed from mid-flight and can open again", () => {
		const { c, morph } = setup();
		c.open();
		morph.destroy();
		c.reset();
		expect(c.phase).toBe("closed");
		c.open();
		expect(c.phase).toBe("opening");
		run(morph);
		expect(c.phase).toBe("open");
	});
});

describe("Controller with flights", () => {
	function withFlight() {
		const dest = document.createElement("div");
		const src = document.createElement("div");
		document.body.append(dest, src);
		let flight: Flight | null = null;
		const s = setup({
			flights: () => {
				flight = new Flight(
					() => src,
					() => dest,
					() => s.flightLayer,
				);
				return [flight];
			},
		});
		return { ...s, dest, src, flight: () => flight };
	}

	it("grows the surface from its source", () => {
		const { c, morph, surface } = withFlight();
		c.open();
		expect(surface.style.width).toBe("80px");
		expect(surface.style.opacity).toBe("0");
		morph.destroy();
		c.reset();
	});

	it("takes the surface back to its source", async () => {
		const { c, morph, surface } = withFlight();
		c.open();
		await vi.waitFor(() => expect(c.phase).toBe("open"), { timeout: 4000 });
		c.close();
		run(morph);
		expect(Number.parseFloat(surface.style.width)).toBeCloseTo(80, 0);
		morph.destroy();
		c.reset();
	});

	it("waits for the slower of surface and flight", async () => {
		const { c, morph, flightLayer, phases } = withFlight();
		c.open();
		run(morph);
		expect(flightLayer.children).toHaveLength(1);
		expect(phases).toEqual(["opening"]);
		await vi.waitFor(() => expect(c.phase).toBe("open"), { timeout: 4000 });
		expect(flightLayer.children).toHaveLength(0);
	});

	it("restores the originals on landing home", async () => {
		const { c, src, flightLayer } = withFlight();
		c.open();
		await vi.waitFor(() => expect(c.phase).toBe("open"), { timeout: 4000 });
		expect(src.style.visibility).toBe("hidden");
		c.close();
		await vi.waitFor(() => expect(c.phase).toBe("closed"), { timeout: 4000 });
		expect(src.style.visibility).toBe("");
		expect(flightLayer.children).toHaveLength(0);
	});

	it("cleans up the flights on reset", () => {
		const { c, morph, src, flightLayer } = withFlight();
		c.open();
		morph.destroy();
		c.reset();
		expect(flightLayer.children).toHaveLength(0);
		expect(src.style.visibility).toBe("");
	});
});
