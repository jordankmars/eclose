// @vitest-environment jsdom
import { StrictMode, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { Morph } from "../core";
import { Eclosion } from "./eclosion";
import { click, dialog, render, settle, trigger } from "./test-utils";

function Basic(props: { defaultOpen?: boolean }) {
	return (
		<Eclosion.Root {...props}>
			<Eclosion.Trigger>Share</Eclosion.Trigger>
			<Eclosion.Content>
				<p>Body</p>
				<Eclosion.Close />
			</Eclosion.Content>
		</Eclosion.Root>
	);
}

function Unmounting() {
	const [show, setShow] = useState(true);
	return (
		<>
			<button id="drop" type="button" onClick={() => setShow(false)} />
			{show && <Basic defaultOpen />}
		</>
	);
}

describe("open and close", () => {
	it("renders nothing until opened", () => {
		render(<Basic />);
		expect(dialog()).toBeNull();
		expect(trigger().getAttribute("aria-expanded")).toBe("false");
	});

	it("opens into a portal outside the app and reports its phase", async () => {
		render(<Basic />);
		click(trigger());
		expect(dialog().closest("#app")).toBeNull();
		expect(dialog().closest("[data-eclosion]")).not.toBeNull();
		expect(dialog().getAttribute("data-state")).toBe("opening");
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
		expect(trigger().getAttribute("aria-expanded")).toBe("true");
	});

	it("unmounts only once the close has landed", async () => {
		render(<Basic />);
		click(trigger());
		await settle();
		click(dialog().querySelector("button") as Element);
		expect(dialog().getAttribute("data-state")).toBe("closing");
		await settle();
		expect(dialog()).toBeNull();
		expect(document.querySelector("[data-eclosion]")).toBeNull();
	});

	it("hides the trigger behind the surface and brings it back", async () => {
		render(<Basic />);
		click(trigger());
		await settle();
		expect(trigger().style.opacity).toBe("0");
		click(dialog().querySelector("button") as Element);
		await settle();
		expect(trigger().style.opacity).toBe("");
	});

	it("keeps the trigger hidden until the surface starts to fade", async () => {
		render(<Basic />);
		click(trigger());
		await settle();
		const to = vi.spyOn(Morph.prototype, "to");
		click(dialog().querySelector("button") as Element);
		const morph = to.mock.contexts[0] as Morph;
		while (morph.progress > 20) morph.step(1 / 240);
		expect(trigger().style.opacity).toBe("0");
		while (morph.progress > 3) morph.step(1 / 240);
		expect(trigger().style.opacity).toBe("");
		to.mockRestore();
		await settle();
	});

	it("can be caught on the way out", async () => {
		render(<Basic />);
		click(trigger());
		await settle();
		click(dialog().querySelector("button") as Element);
		click(trigger());
		expect(dialog().getAttribute("data-state")).toBe("opening");
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("wraps children in a layer that doesn't affect layout at rest", async () => {
		render(<Basic />);
		click(trigger());
		await settle();
		const inner = dialog().firstElementChild as HTMLElement;
		expect(inner.style.display).toBe("contents");
	});
});

describe("control", () => {
	it("defaultOpen appears without motion", () => {
		render(<Basic defaultOpen />);
		expect(dialog().getAttribute("data-state")).toBe("open");
		expect(dialog().style.width).toBe("");
	});

	it("follows a controlled prop in both directions", async () => {
		const ui = (open: boolean) => (
			<Eclosion.Root open={open}>
				<Eclosion.Trigger>Share</Eclosion.Trigger>
				<Eclosion.Content>Body</Eclosion.Content>
			</Eclosion.Root>
		);
		const { rerender } = render(ui(false));
		rerender(ui(true));
		expect(dialog().getAttribute("data-state")).toBe("opening");
		await settle();
		rerender(ui(false));
		expect(dialog().getAttribute("data-state")).toBe("closing");
		await settle();
		expect(dialog()).toBeNull();
	});

	it("lets a controlled parent veto a close", async () => {
		const onOpenChange = vi.fn();
		render(
			<Eclosion.Root open onOpenChange={onOpenChange}>
				<Eclosion.Trigger>Share</Eclosion.Trigger>
				<Eclosion.Content>
					<Eclosion.Close />
				</Eclosion.Content>
			</Eclosion.Root>,
		);
		await settle();
		click(dialog().querySelector("button") as Element);
		expect(onOpenChange).toHaveBeenCalledWith(false);
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("respects a handler that prevents the default", () => {
		render(
			<Eclosion.Root>
				<Eclosion.Trigger onClick={(e) => e.preventDefault()}>
					x
				</Eclosion.Trigger>
				<Eclosion.Content />
			</Eclosion.Root>,
		);
		click(trigger());
		expect(dialog()).toBeNull();
	});
});

describe("asChild", () => {
	it("puts the behaviour on the child and keeps its handlers", () => {
		const childClick = vi.fn();
		render(
			<Eclosion.Root>
				<Eclosion.Trigger asChild className="a">
					<button type="button" className="b" onClick={childClick}>
						Open
					</button>
				</Eclosion.Trigger>
				<Eclosion.Content />
			</Eclosion.Root>,
		);
		const el = trigger();
		expect(document.querySelectorAll("button")).toHaveLength(1);
		expect(el.className).toBe("a b");
		click(el);
		expect(childClick).toHaveBeenCalledOnce();
		expect(dialog()).not.toBeNull();
	});
});

describe("React environment", () => {
	it("survives Strict Mode's double effects", async () => {
		render(
			<StrictMode>
				<Basic />
			</StrictMode>,
		);
		click(trigger());
		expect(dialog().getAttribute("data-state")).toBe("opening");
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
		expect(document.querySelectorAll("[data-eclosion]")).toHaveLength(1);
		click(dialog().querySelector("button") as Element);
		await settle();
		expect(dialog()).toBeNull();
	});

	it("keeps defaultOpen settled in Strict Mode", () => {
		render(
			<StrictMode>
				<Basic defaultOpen />
			</StrictMode>,
		);
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("cleans up when unmounted while open", async () => {
		render(<Unmounting />);
		await settle();
		click(document.getElementById("drop") as Element);
		expect(document.querySelector("[data-eclosion]")).toBeNull();
	});
});
