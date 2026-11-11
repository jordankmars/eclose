// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { Eclose } from "./eclose";
import { $, click, dialog, render, settle, trigger } from "./test-utils";

function Card({
	placement = "centered",
}: {
	placement?: "centered" | "anchored";
}) {
	return (
		<Eclose.Root placement={placement}>
			<Eclose.Trigger>
				<Eclose.Shared id="cover" className="thumb" />
			</Eclose.Trigger>
			<Eclose.Content>
				<Eclose.Shared id="cover" className="hero" />
				<Eclose.Close id="close" />
			</Eclose.Content>
		</Eclose.Root>
	);
}

/** A sticky bar painted over the trigger, away from the content's resting place by default. */
function coverTrigger(left = 100, top = 100) {
	const bar = document.createElement("header");
	bar.style.position = "sticky";
	bar.getBoundingClientRect = () =>
		({
			left,
			top,
			width: 50,
			height: 50,
			right: left + 50,
			bottom: top + 50,
		}) as DOMRect;
	document.body.append(bar);
	document.elementsFromPoint = () => [bar, trigger()];
	return bar;
}

const positioner = () => dialog().parentElement as HTMLElement;
const flightLayer = () => $("[inert][aria-hidden]");

afterEach(() => {
	document.elementsFromPoint = () => [];
});

describe("travelling under sticky bars", () => {
	it("cuts the bar out of both layers on the way in", () => {
		render(<Card />);
		coverTrigger();
		click(trigger());
		expect(positioner().style.clipPath).toContain("evenodd");
		expect(flightLayer().style.clipPath).toContain("evenodd");
	});

	it("removes the cut once it's open", async () => {
		render(<Card />);
		coverTrigger();
		click(trigger());
		await settle();
		expect(positioner().style.clipPath).toBe("");
		expect(flightLayer().style.clipPath).toBe("");
	});

	it("cuts the bar out on the way home", async () => {
		render(<Card />);
		coverTrigger();
		click(trigger());
		await settle();
		click($("#close"));
		expect(positioner().style.clipPath).toContain("evenodd");
		expect(flightLayer().style.clipPath).toContain("evenodd");
		await settle();
		expect(dialog()).toBeNull();
	});

	it("keeps the cut when interrupted", async () => {
		render(<Card />);
		coverTrigger();
		click(trigger());
		click(trigger());
		expect(positioner().style.clipPath).toContain("evenodd");
		click(trigger());
		expect(positioner().style.clipPath).toContain("evenodd");
		await settle();
		expect(positioner().style.clipPath).toBe("");
	});

	it("looks for bars before the page goes inert", () => {
		render(<Card />);
		const bar = coverTrigger();
		const inert: boolean[] = [];
		document.elementsFromPoint = () => {
			inert.push($("#app").hasAttribute("inert"));
			return [bar, trigger()];
		};
		click(trigger());
		expect(inert.length).toBeGreaterThan(0);
		expect(inert).not.toContain(true);
		expect($("#app").hasAttribute("inert")).toBe(true);
	});

	it("leaves a bar alone if the content rests on it", () => {
		render(<Card />);
		coverTrigger(-10, -10);
		click(trigger());
		expect(positioner().style.clipPath).toBe("");
	});

	it("leaves anchored content alone", () => {
		render(<Card placement="anchored" />);
		coverTrigger();
		click(trigger());
		expect(positioner().style.clipPath).toBe("");
	});

	it("leaves the layers alone when nothing covers the trigger", () => {
		render(<Card />);
		click(trigger());
		expect(positioner().style.clipPath).toBe("");
	});
});
