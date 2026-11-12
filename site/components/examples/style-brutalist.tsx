"use client";

import { Eclosion } from "eclosion/react";

const items = ["Copy link", "Send by email", "Post to #design"];

export function StyleBrutalist() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-amber-100" />
			<Eclosion.Root>
				<Eclosion.Trigger className="relative h-11 border-[3px] border-black bg-yellow-300 px-5 text-sm font-black text-black uppercase shadow-[4px_4px_0_#000]">
					Share
				</Eclosion.Trigger>
				<Eclosion.Content className="grid w-64 gap-1 border-[3px] border-black bg-white p-2 text-sm font-bold text-black shadow-[8px_8px_0_#000]">
					<div className="-mx-2 -mt-2 mb-1 flex items-center justify-between border-b-[3px] border-black bg-pink-400 px-3 py-2">
						<Eclosion.Title className="text-xs font-black uppercase">
							Share “Q3 roadmap”
						</Eclosion.Title>
						<Eclosion.Close className="font-black" />
					</div>
					{items.map((item) => (
						<Eclosion.Close
							key={item}
							className="border-2 border-transparent px-2 py-1.5 text-left hover:border-black hover:bg-cyan-300"
						>
							{item}
						</Eclosion.Close>
					))}
				</Eclosion.Content>
			</Eclosion.Root>
		</>
	);
}
