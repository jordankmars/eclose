// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Eclose } from "./eclose";

const App = (props: { defaultOpen?: boolean }) => (
	<Eclose.Root {...props} placement="centered">
		<Eclose.Trigger>Open</Eclose.Trigger>
		<Eclose.Overlay />
		<Eclose.Content>
			<Eclose.Title>Heading</Eclose.Title>
		</Eclose.Content>
	</Eclose.Root>
);

describe("on the server", () => {
	it("has no document to touch", () => {
		expect(typeof document).toBe("undefined");
	});

	it("renders just the trigger when closed", () => {
		const html = renderToString(<App />);
		expect(html).toContain("Open");
		expect(html).not.toContain('role="dialog"');
		expect(html).not.toContain("Heading");
	});

	it("renders no portal content when open by default", () => {
		const error = vi.spyOn(console, "error");
		const html = renderToString(<App defaultOpen />);
		expect(html).toContain("Open");
		expect(html).not.toContain("Heading");
		expect(error).not.toHaveBeenCalled();
		error.mockRestore();
	});
});
