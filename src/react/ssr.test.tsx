// @vitest-environment node
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Eclosion } from "./eclosion";

const App = (props: { defaultOpen?: boolean }) => (
	<Eclosion.Root {...props} placement="centered">
		<Eclosion.Trigger>Open</Eclosion.Trigger>
		<Eclosion.Overlay />
		<Eclosion.Content>
			<Eclosion.Title>Heading</Eclosion.Title>
		</Eclosion.Content>
	</Eclosion.Root>
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
