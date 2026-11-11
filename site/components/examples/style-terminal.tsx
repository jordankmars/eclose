"use client";

import { Eclose } from "eclose/react";

const line = "border border-green-500/60 bg-black font-mono text-green-400";
const items = ["copy-link", "send --email", "post #design"];

export function StyleTerminal() {
	return (
		<>
			<div className="absolute inset-0 rounded-xl bg-black" />
			<Eclose.Root>
				<Eclose.Trigger className={`${line} relative h-9 px-4 text-[13px]`}>
					$ share
				</Eclose.Trigger>
				<Eclose.Content className={`${line} grid w-64 p-2 text-[13px]`}>
					<div className="flex items-center justify-between px-1 pb-2 text-green-500/70">
						<Eclose.Title>~/q3-roadmap</Eclose.Title>
						<Eclose.Close>[x]</Eclose.Close>
					</div>
					{items.map((item) => (
						<Eclose.Close
							key={item}
							className="px-1 py-1 text-left hover:bg-green-400 hover:text-black"
						>
							&gt; {item}
						</Eclose.Close>
					))}
				</Eclose.Content>
			</Eclose.Root>
		</>
	);
}
