// @vitest-environment jsdom
import { act, type ReactNode } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Eclosion } from "./eclosion";
import { click, dialog, settle, trigger } from "./test-utils";

const App = (props: { defaultOpen?: boolean }) => (
	<Eclosion.Root {...props} placement="centered">
		<Eclosion.Trigger>Open</Eclosion.Trigger>
		<Eclosion.Overlay />
		<Eclosion.Content>
			<Eclosion.Title>Heading</Eclosion.Title>
		</Eclosion.Content>
	</Eclosion.Root>
);

/** Hydrates server markup, handing back every mismatch React reported. */
function hydrate(ui: ReactNode) {
	const host = document.createElement("div");
	host.innerHTML = renderToString(ui);
	document.body.append(host);
	const onRecoverableError = vi.fn();
	const error = vi.spyOn(console, "error");
	const root = hydrateRoot(host, ui, { onRecoverableError });
	return { root, error, onRecoverableError };
}

describe("hydration", () => {
	it("matches the server when closed, and still opens", async () => {
		const { root, error, onRecoverableError } = hydrate(<App />);
		await settle();
		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		expect(dialog()).toBeNull();

		click(trigger());
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");

		act(() => root.unmount());
		error.mockRestore();
	});

	it("shows defaultOpen content once hydrated, without a mismatch", async () => {
		const { root, error, onRecoverableError } = hydrate(<App defaultOpen />);
		await settle();
		expect(onRecoverableError).not.toHaveBeenCalled();
		expect(error).not.toHaveBeenCalled();
		expect(dialog().getAttribute("data-state")).toBe("open");
		expect(document.activeElement).toBe(dialog());

		act(() => root.unmount());
		error.mockRestore();
	});
});
