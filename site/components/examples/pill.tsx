"use client";

import { Eclose } from "eclose/react";

export function Pill() {
	return (
		<Eclose.Root>
			<Eclose.Trigger className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs text-neutral-50 dark:bg-neutral-800">
				Now playing
			</Eclose.Trigger>
			<Eclose.Content className="grid h-36 w-80 grid-cols-[52px_1fr] grid-rows-[auto_1fr_auto] gap-x-3 rounded-[36px] bg-neutral-900 px-5 py-[18px] text-neutral-50 dark:bg-neutral-800">
				<div className="size-[52px] rounded-xl bg-linear-to-br from-teal-700 to-amber-100" />
				<div className="self-center">
					<Eclose.Title className="text-sm font-semibold">
						Low Tide
					</Eclose.Title>
					<Eclose.Description className="text-xs text-neutral-400">
						Harbor Lights
					</Eclose.Description>
				</div>
				<div className="col-span-2 row-start-3 flex items-center gap-2 text-[11px] text-neutral-400">
					<span>1:12</span>
					<div className="h-1 flex-1 rounded-full bg-neutral-700">
						<div className="h-full w-2/5 rounded-full bg-neutral-50" />
					</div>
					<span>3:08</span>
				</div>
			</Eclose.Content>
		</Eclose.Root>
	);
}
