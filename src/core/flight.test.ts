// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import { configure } from "./config";
import { Flight } from "./flight";

function setup() {
	const source = document.createElement("div");
	const dest = document.createElement("div");
	dest.id = "hero";
	dest.innerHTML = '<span id="inner"></span>';
	const layer = document.createElement("div");
	document.body.append(source, dest, layer);
	const f = new Flight(
		() => source,
		() => dest,
		() => layer,
	);
	return { f, source, dest, layer };
}

afterEach(() => {
	document.body.innerHTML = "";
	configure({ reduced: null });
});

/** Runs the flight's copy to the end through the shared frame loop. */
async function landed(done: ReturnType<typeof vi.fn>) {
	await vi.waitFor(() => expect(done).toHaveBeenCalled(), { timeout: 4000 });
}

describe("Flight", () => {
	it("flies a copy with no duplicate ids, hiding both originals", () => {
		const { f, source, dest, layer } = setup();
		f.fly(true, () => {});
		expect(layer.children).toHaveLength(1);
		expect(layer.querySelector("[id]")).toBeNull();
		expect(source.style.visibility).toBe("hidden");
		expect(dest.style.visibility).toBe("hidden");
		f.destroy();
	});

	it("reveals the real destination on landing", async () => {
		const { f, source, dest, layer } = setup();
		const done = vi.fn();
		f.fly(true, done);
		await landed(done);
		expect(layer.children).toHaveLength(0);
		expect(dest.style.visibility).toBe("");
		expect(source.style.visibility).toBe("hidden");
	});

	it("launches a return flight from where the destination is", () => {
		const { f, dest, source, layer } = setup();
		dest.getBoundingClientRect = () =>
			({ left: 300, top: 200, width: 100, height: 50 }) as DOMRect;
		source.getBoundingClientRect = () =>
			({ left: 10, top: 10, width: 20, height: 20 }) as DOMRect;
		f.fly(false, () => {});
		const copy = layer.firstElementChild as HTMLElement;
		expect(copy.style.left).toBe("300px");
		expect(copy.style.top).toBe("200px");
		f.destroy();
	});

	it("reuses the copy when interrupted", () => {
		const { f, layer } = setup();
		f.fly(true, () => {});
		const copy = layer.firstChild;
		f.fly(false, () => {});
		expect(layer.firstChild).toBe(copy);
		expect(layer.children).toHaveLength(1);
		f.destroy();
	});

	it("restores everything on destroy", () => {
		const { f, source, dest, layer } = setup();
		f.fly(true, () => {});
		f.destroy();
		expect(layer.children).toHaveLength(0);
		expect(source.style.visibility).toBe("");
		expect(dest.style.visibility).toBe("");
	});

	it("skips the flight under reduced motion", () => {
		configure({ reduced: true });
		const { f, layer, source } = setup();
		const done = vi.fn();
		f.fly(true, done);
		expect(done).toHaveBeenCalledOnce();
		expect(layer.children).toHaveLength(0);
		expect(source.style.visibility).toBe("hidden");
	});

	it("still lands when its source has gone", async () => {
		const { f, source, layer } = setup();
		f.fly(true, () => {});
		source.remove();
		const done = vi.fn();
		f.fly(false, done);
		await landed(done);
		expect(layer.children).toHaveLength(1);
		f.destroy();
		expect(layer.children).toHaveLength(0);
	});

	it("hides the source without flying when settled", () => {
		const { f, source, layer } = setup();
		f.settle();
		expect(source.style.visibility).toBe("hidden");
		expect(layer.children).toHaveLength(0);
	});
});
