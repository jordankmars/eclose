"use client";

import { Eclosion } from "eclosion/react";

const items = ["Copy link", "Send by email", "Post to #design"];

export function Popover() {
	return (
		<Eclosion.Root>
			<Eclosion.Trigger className="h-9 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900">
				Share
			</Eclosion.Trigger>
			<Eclosion.Content className="grid w-60 rounded-2xl border border-neutral-200 bg-white p-1.5 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
				<div className="flex items-center justify-between px-2.5 py-1.5">
					<Eclosion.Title className="text-xs text-neutral-500 dark:text-neutral-400">
						Share “Q3 roadmap”
					</Eclosion.Title>
					<Eclosion.Close className="text-neutral-500 dark:text-neutral-400" />
				</div>
				{items.map((item) => (
					<Eclosion.Close
						key={item}
						className="rounded-lg px-2.5 py-2 text-left hover:bg-neutral-100 dark:hover:bg-neutral-800"
					>
						{item}
					</Eclosion.Close>
				))}
			</Eclosion.Content>
		</Eclosion.Root>
	);
}
