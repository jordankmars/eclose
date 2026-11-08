// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import { Eclose } from "./eclose";
import { $, click, dialog, render, settle, trigger } from "./test-utils";

function finger(type: string, target: Element, y: number, t = 0) {
	act(() => {
		const e = new Event(type, { bubbles: true, cancelable: true });
		Object.defineProperty(e, "touches", {
			value: type === "touchend" ? [] : [{ clientX: 0, clientY: y }],
		});
		Object.defineProperty(e, "timeStamp", { value: t });
		target.dispatchEvent(e);
	});
}

function drag(target: Element, distance: number) {
	finger("touchstart", target, 100);
	finger("touchmove", target, 110, 10);
	finger("touchmove", target, 110 + distance, 1000);
	finger("touchmove", target, 110 + distance, 2000);
	finger("touchend", target, 110 + distance, 3000);
}

function Sheet(props: {
	swipe?: boolean;
	onOpenChange?: (o: boolean) => void;
}) {
	return (
		<Eclose.Root placement="centered" {...props}>
			<Eclose.Trigger>Open</Eclose.Trigger>
			<Eclose.Content>
				<Eclose.Root>
					<Eclose.Trigger id="menu">Menu</Eclose.Trigger>
					<Eclose.Content id="menu-content" />
				</Eclose.Root>
			</Eclose.Content>
		</Eclose.Root>
	);
}

async function opened(props: Parameters<typeof Sheet>[0] = {}) {
	render(<Sheet {...props} />);
	click(trigger());
	await settle();
}

// jsdom has no layout, and a zero-height sheet would dismiss on any drag.
Element.prototype.getBoundingClientRect = () =>
	({ left: 0, top: 0, width: 320, height: 800 }) as DOMRect;

describe("swipe to dismiss", () => {
	it("dismisses past the line", async () => {
		const onOpenChange = vi.fn();
		await opened({ onOpenChange });
		drag(dialog(), 200);
		expect(onOpenChange).toHaveBeenCalledWith(false);
		expect(dialog().getAttribute("data-state")).toBe("closing");
		await settle();
		expect(dialog()).toBeNull();
	});

	it("springs back from a short drag", async () => {
		await opened();
		drag(dialog(), 10);
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
		expect(dialog().style.transform).toBe("");
	});

	it("can be turned off", async () => {
		await opened({ swipe: false });
		drag(dialog(), 200);
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("only swipes the top layer", async () => {
		await opened();
		click($("#menu"));
		await settle();
		const sheet = $("#menu").closest("[role=dialog]") as Element;
		drag(sheet, 200);
		expect(sheet.getAttribute("data-state")).toBe("open");
	});

	it("doesn't start during the opening morph", () => {
		render(<Sheet />);
		click(trigger());
		drag(dialog(), 200);
		expect(dialog().getAttribute("data-state")).toBe("opening");
	});
});
