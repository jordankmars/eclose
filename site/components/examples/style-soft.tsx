"use client";

import { Eclosion } from "eclosion/react";

const items = ["Copy link", "Send by email", "Post to #design"];

export function StyleSoft() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-indigo-50" />
			<Eclosion.Root>
				<Eclosion.Trigger className="relative h-11 rounded-full bg-white px-6 text-sm font-medium text-slate-700 shadow-[0_8px_24px_rgba(15,23,42,0.12)]">
					Share
				</Eclosion.Trigger>
				<Eclosion.Content className="grid w-64 rounded-[28px] bg-white p-3 text-sm text-slate-700 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
					<div className="flex items-center justify-between px-4 pt-2 pb-3">
						<Eclosion.Title className="font-medium">
							Share “Q3 roadmap”
						</Eclosion.Title>
						<Eclosion.Close className="grid size-7 place-items-center rounded-full bg-slate-100 text-slate-500" />
					</div>
					{items.map((item) => (
						<Eclosion.Close
							key={item}
							className="rounded-2xl px-4 py-3 text-left hover:bg-indigo-50"
						>
							{item}
						</Eclosion.Close>
					))}
				</Eclosion.Content>
			</Eclosion.Root>
		</>
	);
}
