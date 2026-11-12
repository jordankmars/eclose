"use client";

import { Eclosion } from "eclosion/react";

const surface = "rounded-[20px] bg-neutral-100 dark:bg-neutral-800";

export function SearchField() {
	return (
		// As wide as the open field, so it ends up centered.
		<div className="w-[270px] max-w-full">
			<Eclosion.Root origin="left">
				{/* Stays on top the whole time, so the icon never fades. */}
				<Eclosion.Trigger
					aria-label="Search"
					className={`${surface} relative grid size-10 place-items-center opacity-100! data-[state=closing]:z-[10000] data-[state=open]:z-[10000] data-[state=opening]:z-[10000]`}
				>
					<svg
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2.2"
						strokeLinecap="round"
						aria-hidden
						className="size-[17px]"
					>
						<circle cx="11" cy="11" r="7" />
						<path d="m20 20-3.5-3.5" />
					</svg>
				</Eclosion.Trigger>
				<Eclosion.Content
					className={`${surface} relative h-10 w-[270px] max-w-[calc(100vw-32px)] motion-safe:opacity-100!`}
				>
					<input
						// biome-ignore lint/a11y/noAutofocus: the field is the whole point
						autoFocus
						aria-label="Search files"
						placeholder="Search files"
						className="absolute top-0 left-[38px] h-10 w-[220px] bg-transparent text-sm outline-none"
					/>
				</Eclosion.Content>
			</Eclosion.Root>
		</div>
	);
}
