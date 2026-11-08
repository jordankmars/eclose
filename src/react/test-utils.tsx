import { act, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach } from "vitest";
import { configure } from "../core";

// Runs every spring in one frame, so tests can wait on real landings.

(
	globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Root[] = [];

beforeEach(() => configure({ speed: 500 }));

afterEach(() => {
	act(() => {
		for (const root of mounted.splice(0)) root.unmount();
	});
	document.body.innerHTML = "";
	document.documentElement.removeAttribute("style");
	configure({ speed: 1, reduced: null });
});

export function render(ui: ReactNode): { rerender: (next: ReactNode) => void } {
	const host = document.createElement("div");
	host.id = "app";
	document.body.append(host);
	const root = createRoot(host);
	mounted.push(root);
	act(() => root.render(ui));
	return { rerender: (next) => act(() => root.render(next)) };
}

export const $ = <T extends HTMLElement = HTMLElement>(selector: string) =>
	document.querySelector<T>(selector) as T;

export const dialog = () => $('[role="dialog"]');
export const trigger = () => $("[aria-haspopup]");

export function click(el: Element): void {
	act(() => el.dispatchEvent(new MouseEvent("click", { bubbles: true })));
}

/** Lets the frame loop run until springs have landed and React has caught up. */
export async function settle(): Promise<void> {
	await act(async () => {
		await new Promise((resolve) => setTimeout(resolve, 80));
	});
}
