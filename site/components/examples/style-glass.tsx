"use client";

import { Eclosion } from "eclosion/react";

const glass =
	"border border-white/30 bg-white/20 text-white backdrop-blur-xl backdrop-saturate-150";
const items = ["Copy link", "Send by email", "Post to #design"];

export function StyleGlass() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-linear-to-br from-fuchsia-500 via-violet-500 to-sky-400" />
			<Eclosion.Root>
				<Eclosion.Trigger
					className={`${glass} relative h-10 rounded-full px-5 text-sm font-medium`}
				>
					Share
				</Eclosion.Trigger>
				<Eclosion.Content
					className={`${glass} grid w-60 rounded-3xl p-2 text-sm shadow-xl shadow-black/20`}
				>
					<div className="flex items-center justify-between px-3 py-2">
						<Eclosion.Title className="text-xs text-white/70">
							Share “Q3 roadmap”
						</Eclosion.Title>
						<Eclosion.Close className="text-white/70" />
					</div>
					{items.map((item) => (
						<Eclosion.Close
							key={item}
							className="rounded-2xl px-3 py-2 text-left hover:bg-white/20"
						>
							{item}
						</Eclosion.Close>
					))}
				</Eclosion.Content>
			</Eclosion.Root>
		</>
	);
}
