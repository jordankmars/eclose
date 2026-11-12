"use client";

import { Eclosion } from "eclosion/react";
import Link from "next/link";
import { external, GITHUB_URL } from "@/lib/links";
import { BoxIcon, CloseIcon } from "./icons";

// A port of the playground's "Button to popover" (playground/App.tsx), with the
// same sizes and close mark. The "ink" surface is neutral-900 in light mode and
// neutral-100 in dark mode.
//
// There, the button itself becomes the menu. Here the menu is its own surface,
// which eclosion crossfades with the trigger near each end. Both look the same,
// so the surface stays opaque and the trigger sits above it instead: the shape
// grows and collapses as one, and only the label fades. Reduced motion keeps
// eclosion's own fade.
const ink =
	"bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900";
const focus =
	"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-neutral-400";
const hover = "hover:bg-neutral-50/12 dark:hover:bg-neutral-900/12";
const item = `${hover} ${focus} rounded-[9px] px-2.5 py-[9px]`;

export function UseEclosionMenu() {
	return (
		<Eclosion.Root>
			<Eclosion.Trigger
				className={`${ink} ${focus} relative z-[10000] flex h-10 items-center gap-2 overflow-hidden rounded-xl px-4 text-[14px]/[1.5] font-medium transition-opacity duration-150 data-[state=open]:pointer-events-none data-[state=opening]:pointer-events-none`}
			>
				<BoxIcon className="size-[15px]" />
				Use Eclosion
			</Eclosion.Trigger>
			<Eclosion.Content
				className={`${ink} grid w-[250px] rounded-2xl p-1.5 text-[14px]/[1.5] motion-safe:opacity-100!`}
			>
				<div className="flex items-center justify-between px-2 pt-1.5 pb-2 text-[12.5px] opacity-70">
					<Eclosion.Title>Eclosion</Eclosion.Title>
					<Eclosion.Close
						aria-label="Close"
						className={`${hover} ${focus} grid size-6 place-items-center rounded-md`}
					>
						<CloseIcon className="size-3" />
					</Eclosion.Close>
				</div>
				<Eclosion.Close asChild>
					<Link href="/docs" className={item}>
						Documentation
					</Link>
				</Eclosion.Close>
				<Eclosion.Close asChild>
					<a href={GITHUB_URL} {...external} className={item}>
						GitHub
					</a>
				</Eclosion.Close>
			</Eclosion.Content>
		</Eclosion.Root>
	);
}
