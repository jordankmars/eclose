import { afterEach, describe, expect, it, vi } from "vitest";
import { configure, isReduced } from "./config";

function systemPrefers(matches: boolean) {
	vi.stubGlobal("window", { matchMedia: () => ({ matches }) });
}

afterEach(() => {
	vi.unstubAllGlobals();
	configure({ reduced: null });
});

describe("isReduced", () => {
	it("is false without a window, as on the server", () => {
		expect(isReduced()).toBe(false);
	});

	it("follows the system setting as it changes", () => {
		systemPrefers(true);
		expect(isReduced()).toBe(true);
		systemPrefers(false);
		expect(isReduced()).toBe(false);
	});

	it("lets an explicit value win over the system", () => {
		systemPrefers(true);
		configure({ reduced: false });
		expect(isReduced()).toBe(false);
	});
});
