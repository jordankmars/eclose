// @vitest-environment jsdom
import { act, StrictMode, useRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { Eclosion } from "./eclosion";
import { $, click, dialog, render, settle, trigger } from "./test-utils";

function Dialog(props: {
	placement?: "anchored" | "centered";
	modal?: boolean;
	onOpenChange?: (open: boolean) => void;
}) {
	return (
		<>
			<main id="page">
				<button id="outside" type="button" />
			</main>
			<Eclosion.Root {...props}>
				<Eclosion.Trigger>Open</Eclosion.Trigger>
				<Eclosion.Overlay className="scrim" />
				<Eclosion.Content>
					<Eclosion.Title>Heading</Eclosion.Title>
					<Eclosion.Description>Words</Eclosion.Description>
					<button id="first" type="button" />
					<button id="last" type="button" />
				</Eclosion.Content>
			</Eclosion.Root>
		</>
	);
}

function WithInitialFocus(props: { attached: boolean; defaultOpen?: boolean }) {
	const target = useRef<HTMLButtonElement>(null);
	return (
		<Eclosion.Root defaultOpen={props.defaultOpen}>
			<Eclosion.Trigger>Open</Eclosion.Trigger>
			<Eclosion.Content initialFocus={target}>
				{/* biome-ignore lint/a11y/noAutofocus: what's under test */}
				<input id="auto" autoFocus />
				{props.attached && <button id="target" type="button" ref={target} />}
			</Eclosion.Content>
		</Eclosion.Root>
	);
}

const key = (name: string, shiftKey = false) =>
	act(() => {
		(document.activeElement ?? document).dispatchEvent(
			new KeyboardEvent("keydown", {
				key: name,
				shiftKey,
				bubbles: true,
				cancelable: true,
			}),
		);
	});

function press(target: Element) {
	act(() => {
		const e = new Event("pointerdown", { bubbles: true });
		Object.assign(e, { pointerType: "mouse" });
		target.dispatchEvent(e);
	});
}

async function opened(props: Parameters<typeof Dialog>[0] = {}) {
	render(<Dialog {...props} />);
	click(trigger());
	await settle();
}

describe("dismissal", () => {
	it("closes on Escape", async () => {
		await opened();
		key("Escape");
		expect(dialog().getAttribute("data-state")).toBe("closing");
	});

	it("closes on a press outside", async () => {
		await opened();
		press($("#outside"));
		expect(dialog().getAttribute("data-state")).toBe("closing");
	});

	it("stays open for a press inside", async () => {
		await opened();
		press($("#first"));
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("asks a controlled parent instead of closing", async () => {
		const onOpenChange = vi.fn();
		await opened({ onOpenChange });
		key("Escape");
		expect(onOpenChange).toHaveBeenCalledWith(false);
	});
});

describe("focus", () => {
	it("moves to the dialog on open and back to the trigger on close", async () => {
		await opened();
		expect(document.activeElement).toBe(dialog());
		key("Escape");
		expect(document.activeElement).toBe(trigger());
	});

	it("prefers the initialFocus ref over an autoFocus child", async () => {
		render(<WithInitialFocus attached />);
		click(trigger());
		expect(document.activeElement).toBe($("#target"));
		expect(dialog().hasAttribute("initialfocus")).toBe(false);
		await settle();
	});

	it("falls through when the initialFocus ref is still null", async () => {
		render(<WithInitialFocus attached={false} />);
		click(trigger());
		expect(document.activeElement).toBe($("#auto"));
		await settle();
	});

	it("uses the initialFocus ref when mounted open", async () => {
		render(<WithInitialFocus attached defaultOpen />);
		expect(document.activeElement).toBe($("#target"));
		await settle();
	});

	it("keeps an autoFocus child focused when mounted open", async () => {
		render(<WithInitialFocus attached={false} defaultOpen />);
		expect(document.activeElement).toBe($("#auto"));
		await settle();
	});

	it("leaves a React autoFocus element focused", async () => {
		render(
			<Eclosion.Root>
				<Eclosion.Trigger>Open</Eclosion.Trigger>
				<Eclosion.Content>
					{/* biome-ignore lint/a11y/noAutofocus: what's under test */}
					<input id="field" autoFocus />
				</Eclosion.Content>
			</Eclosion.Root>,
		);
		click(trigger());
		expect(document.activeElement).toBe($("#field"));
		await settle();
	});

	it("keeps a React autoFocus element focused in Strict Mode", async () => {
		render(
			<StrictMode>
				<Eclosion.Root>
					<Eclosion.Trigger>Open</Eclosion.Trigger>
					<Eclosion.Content>
						{/* biome-ignore lint/a11y/noAutofocus: what's under test */}
						<input id="field" autoFocus />
					</Eclosion.Content>
				</Eclosion.Root>
			</StrictMode>,
		);
		click(trigger());
		expect(document.activeElement).toBe($("#field"));
		await settle();
	});

	it("doesn't take focus back if it has gone elsewhere", async () => {
		await opened({ modal: false });
		$("#outside").focus();
		key("Escape");
		expect(document.activeElement).toBe($("#outside"));
	});

	it("wraps Tab inside a modal", async () => {
		await opened({ modal: true });
		$("#last").focus();
		key("Tab");
		expect(document.activeElement).toBe($("#first"));
		key("Tab", true);
		expect(document.activeElement).toBe($("#last"));
	});

	it("closes a popover when Tab leaves it", async () => {
		await opened();
		$("#last").focus();
		key("Tab");
		expect(dialog().getAttribute("data-state")).toBe("closing");
		expect(document.activeElement).toBe(trigger());
	});
});

describe("modality", () => {
	it("a centered dialog locks the page and makes it inert", async () => {
		await opened({ placement: "centered" });
		expect($("#app").hasAttribute("inert")).toBe(true);
		expect(document.documentElement.style.overflow).toBe("hidden");
		expect(dialog().getAttribute("aria-modal")).toBe("true");
	});

	it("hands the page back as soon as it starts closing", async () => {
		await opened({ placement: "centered" });
		key("Escape");
		expect($("#app").hasAttribute("inert")).toBe(false);
		expect(document.documentElement.style.overflow).toBe("");
		expect(dialog().hasAttribute("inert")).toBe(true);
	});

	it("an anchored popover leaves the page usable", async () => {
		await opened();
		expect($("#app").hasAttribute("inert")).toBe(false);
		expect(document.documentElement.style.overflow).toBe("");
		expect(dialog().hasAttribute("aria-modal")).toBe(false);
	});

	it("modal opts an anchored popover in", async () => {
		await opened({ modal: true });
		expect($("#app").hasAttribute("inert")).toBe(true);
	});
});

describe("aria", () => {
	it("labels the dialog from its title and description", async () => {
		await opened();
		const labelled = dialog().getAttribute("aria-labelledby") as string;
		const described = dialog().getAttribute("aria-describedby") as string;
		expect(document.getElementById(labelled)?.textContent).toBe("Heading");
		expect(document.getElementById(described)?.textContent).toBe("Words");
	});

	it("doesn't point at a title that isn't there", () => {
		render(
			<Eclosion.Root defaultOpen>
				<Eclosion.Trigger>Open</Eclosion.Trigger>
				<Eclosion.Content />
			</Eclosion.Root>,
		);
		expect(dialog().hasAttribute("aria-labelledby")).toBe(false);
	});

	it("connects the trigger to the dialog", async () => {
		await opened();
		expect(trigger().getAttribute("aria-controls")).toBe(dialog().id);
	});
});

describe("overlay", () => {
	it("fades with the morph and is cleared at rest", async () => {
		render(<Dialog />);
		click(trigger());
		expect($(".scrim").style.opacity).toBe("0");
		await settle();
		expect($(".scrim").style.opacity).toBe("");
	});

	it("goes away with the content", async () => {
		await opened();
		key("Escape");
		await settle();
		expect($(".scrim")).toBeNull();
	});
});

function Nested() {
	return (
		<Eclosion.Root placement="centered" defaultOpen>
			<Eclosion.Trigger>Outer</Eclosion.Trigger>
			<Eclosion.Content id="outer">
				<Eclosion.Root>
					<Eclosion.Trigger id="inner-trigger">Menu</Eclosion.Trigger>
					<Eclosion.Content id="inner">
						<button id="item" type="button" />
					</Eclosion.Content>
				</Eclosion.Root>
			</Eclosion.Content>
		</Eclosion.Root>
	);
}

describe("nesting", () => {
	it("renders inside its parent's portal, so the parent's inert misses it", async () => {
		render(<Nested />);
		click($("#inner-trigger"));
		await settle();
		const outerPortal = $("#outer").closest("[data-eclosion]");
		expect($("#inner").closest("[data-eclosion]")?.parentElement).toBe(
			outerPortal,
		);
		expect($("#inner").closest("[inert]")).toBeNull();
	});

	it("closes one layer per Escape", async () => {
		render(<Nested />);
		click($("#inner-trigger"));
		await settle();
		key("Escape");
		await settle();
		expect($("#inner")).toBeNull();
		expect($("#outer").getAttribute("data-state")).toBe("open");
		key("Escape");
		expect($("#outer").getAttribute("data-state")).toBe("closing");
	});

	it("treats a press in the child as inside the parent", async () => {
		render(<Nested />);
		click($("#inner-trigger"));
		await settle();
		press($("#item"));
		expect($("#outer").getAttribute("data-state")).toBe("open");
		expect($("#inner").getAttribute("data-state")).toBe("open");
	});

	it("closes just the child for a press on the parent", async () => {
		render(<Nested />);
		click($("#inner-trigger"));
		await settle();
		press($("#outer"));
		expect($("#inner").getAttribute("data-state")).toBe("closing");
		expect($("#outer").getAttribute("data-state")).toBe("open");
	});
});
