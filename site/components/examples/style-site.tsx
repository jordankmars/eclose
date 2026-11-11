"use client";

import { Eclose } from "eclose/react";

const ink =
	"bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900";
const items = ["Copy link", "Send by email", "Post to #design"];

export function StyleSite() {
	return (
		<Eclose.Root>
			<Eclose.Trigger
				className={`${ink} h-10 rounded-xl px-4 text-sm font-medium`}
			>
				Share
			</Eclose.Trigger>
			<Eclose.Content
				className={`${ink} grid w-[250px] rounded-2xl p-1.5 text-sm`}
			>
				<div className="flex items-center justify-between px-2 pt-1.5 pb-2 text-[12.5px] opacity-70">
					<Eclose.Title>Share “Q3 roadmap”</Eclose.Title>
					<Eclose.Close />
				</div>
				{items.map((item) => (
					<Eclose.Close
						key={item}
						className="rounded-[9px] px-2.5 py-[9px] text-left hover:bg-neutral-50/12 dark:hover:bg-neutral-900/12"
					>
						{item}
					</Eclose.Close>
				))}
			</Eclose.Content>
		</Eclose.Root>
	);
}
