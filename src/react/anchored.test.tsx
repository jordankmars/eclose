// @vitest-environment jsdom
import { act } from "react";
import { describe, expect, it, vi } from "vitest";
import type { Origin } from "../core";
import { Morph } from "../core";
import { Eclosion } from "./eclosion";
import { click, dialog, render, resized, settle, trigger } from "./test-utils";

const triggerRect = { left: 100, top: 100, width: 80, height: 30 };
const surfaceRect = { left: 0, top: 0, width: 200, height: 300 };

function stub() {
	Element.prototype.getBoundingClientRect = function () {
		if (this.hasAttribute("aria-haspopup"))
			return { ...triggerRect } as DOMRect;
		if (this.getAttribute("role") === "dialog") {
			return { ...surfaceRect } as DOMRect;
		}
		return { left: 0, top: 0, width: 0, height: 0 } as DOMRect;
	};
}

function Popover(props: {
	placement?: "anchored" | "centered";
	origin?: Origin;
}) {
	return (
		<div id="scroller">
			<Eclosion.Root origin="top-left" {...props}>
				<Eclosion.Trigger>Open</Eclosion.Trigger>
				<Eclosion.Content>
					<p>Body</p>
				</Eclosion.Content>
			</Eclosion.Root>
		</div>
	);
}

const positioner = () => dialog().parentElement as HTMLElement;

describe("anchored placement", () => {
	it("rests on top of its trigger", async () => {
		stub();
		render(<Popover />);
		click(trigger());
		await settle();
		expect(positioner().style.position).toBe("absolute");
		expect(positioner().style.transform).toBe("translate(100px, 100px)");
	});

	it("is placed before it starts to grow", () => {
		stub();
		render(<Popover />);
		click(trigger());
		expect(positioner().style.transform).toBe("translate(100px, 100px)");
	});

	it("follows a trigger carried by a scroll container", async () => {
		stub();
		render(<Popover />);
		click(trigger());
		await settle();
		triggerRect.top = 40;
		act(() => {
			document.getElementById("scroller")?.dispatchEvent(new Event("scroll"));
		});
		triggerRect.top = 100;
		expect(positioner().style.transform).toBe("translate(100px, 40px)");
	});

	it("bends a flight in the air when the layout changes", () => {
		stub();
		render(<Popover />);
		click(trigger());
		surfaceRect.width = 260;
		act(() => {
			dispatchEvent(new Event("resize"));
		});
		surfaceRect.width = 200;
		expect(dialog().getAttribute("data-state")).toBe("opening");
		expect(dialog().style.overflow).toBe("hidden");
	});

	it("closes toward where the trigger is now", async () => {
		stub();
		render(<Popover />);
		click(trigger());
		await settle();
		click(trigger());
		const retarget = vi.spyOn(Morph.prototype, "retarget");
		triggerRect.left = 400;
		act(() => {
			dispatchEvent(new Event("resize"));
		});
		triggerRect.left = 100;
		expect(retarget.mock.calls[0]?.[0]).toMatchObject({ x: 400 });
		retarget.mockRestore();
		await settle();
		expect(dialog()).toBeNull();
	});

	it("reacts to content changing height", async () => {
		stub();
		render(<Popover />);
		click(trigger());
		await settle();
		surfaceRect.height = 900;
		act(() => resized());
		surfaceRect.height = 300;
		expect(positioner().style.transform).toBe("translate(100px, 8px)");
	});
});

describe("origin", () => {
	function openAt(origin: Origin | undefined) {
		stub();
		triggerRect.left = 400;
		triggerRect.top = 400;
		render(<Popover origin={origin} />);
		click(trigger());
		triggerRect.left = 100;
		triggerRect.top = 100;
		return positioner().style.transform;
	}

	it("grows from the center by default", () => {
		stub();
		triggerRect.left = 400;
		triggerRect.top = 400;
		render(
			<Eclosion.Root>
				<Eclosion.Trigger>Open</Eclosion.Trigger>
				<Eclosion.Content>Body</Eclosion.Content>
			</Eclosion.Root>,
		);
		click(trigger());
		triggerRect.left = 100;
		triggerRect.top = 100;
		expect(positioner().style.transform).toBe("translate(340px, 265px)");
	});

	it("shares a corner with the trigger", () => {
		expect(openAt("bottom-right")).toBe("translate(280px, 130px)");
	});

	it("shares a side with the trigger", () => {
		expect(openAt("left")).toBe("translate(400px, 265px)");
	});
});

describe("centered placement", () => {
	it("leaves positioning to the viewport", async () => {
		stub();
		render(<Popover placement="centered" />);
		click(trigger());
		await settle();
		expect(positioner().style.position).toBe("fixed");
		expect(positioner().style.placeItems).toBe("center");
		expect(positioner().style.transform).toBe("");
	});
});
