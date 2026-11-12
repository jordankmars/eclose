// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import { configure } from "../core";
import { Eclosion } from "./eclosion";
import { $, click, dialog, render, settle, trigger } from "./test-utils";

function Card() {
	return (
		<Eclosion.Root placement="centered">
			<Eclosion.Trigger>
				<Eclosion.Shared id="cover" className="thumb" />
			</Eclosion.Trigger>
			<Eclosion.Content>
				<Eclosion.Shared id="cover" className="hero" />
				<Eclosion.Close id="close" />
			</Eclosion.Content>
		</Eclosion.Root>
	);
}

const copy = () => $("[inert][aria-hidden]").firstElementChild as HTMLElement;

describe("Eclosion.Shared", () => {
	it("flies a copy and hides both originals", () => {
		render(<Card />);
		click(trigger());
		expect(copy().classList.contains("hero")).toBe(true);
		expect($(".thumb").style.visibility).toBe("hidden");
		expect($("#close").closest("[role=dialog]")).not.toBeNull();
		expect($(".hero:not([style*='position'])").style.visibility).toBe("hidden");
	});

	it("hides the trigger behind the opaque surface", async () => {
		render(<Card />);
		click(trigger());
		await settle();
		expect(trigger().style.opacity).toBe("0");
	});

	it("shows the real element on landing and keeps the source hidden", async () => {
		render(<Card />);
		click(trigger());
		await settle();
		expect(copy()).toBeNull();
		expect($(".hero").style.visibility).toBe("");
		expect($(".thumb").style.visibility).toBe("hidden");
	});

	it("flies home on close, then restores the source", async () => {
		render(<Card />);
		click(trigger());
		await settle();
		click($("#close"));
		expect(copy()).not.toBeNull();
		expect($(".thumb").style.visibility).toBe("hidden");
		await settle();
		expect(dialog()).toBeNull();
		expect($(".thumb").style.visibility).toBe("");
	});

	it("only fades under reduced motion", async () => {
		configure({ reduced: true });
		render(<Card />);
		click(trigger());
		expect(copy()).toBeNull();
		await settle();
		expect(dialog().getAttribute("data-state")).toBe("open");
	});

	it("morphs the surface normally when the pair is incomplete", () => {
		render(
			<Eclosion.Root>
				<Eclosion.Trigger>
					<Eclosion.Shared id="other" className="thumb" />
				</Eclosion.Trigger>
				<Eclosion.Content />
			</Eclosion.Root>,
		);
		click(trigger());
		expect(copy()).toBeNull();
		expect($(".thumb").style.visibility).toBe("");
	});

	it("doesn't forward its id to the DOM", () => {
		render(<Card />);
		expect($(".thumb").id).toBe("");
	});
});
