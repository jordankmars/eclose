"use client";

import { Eclose } from "eclose/react";

const tracks = Array.from({ length: 30 }, (_, i) => `Track ${i + 1}`);

export function Sheet() {
	return (
		<Eclose.Root placement="centered">
			<Eclose.Trigger className="h-9 rounded-lg border border-neutral-200 bg-white px-4 text-sm font-medium dark:border-neutral-800 dark:bg-neutral-900">
				Open sheet
			</Eclose.Trigger>
			<Eclose.Overlay className="bg-black/40" />
			<Eclose.Content className="grid max-h-[min(520px,80vh)] w-[min(420px,calc(100vw-32px))] grid-rows-[auto_1fr] gap-2.5 rounded-3xl bg-white p-4 dark:bg-neutral-900">
				<Eclose.Title className="text-xl font-semibold tracking-tight">
					Tracks
				</Eclose.Title>
				<div className="min-h-0 overflow-y-auto text-sm">
					{tracks.map((track) => (
						<p key={track} className="py-2">
							{track}
						</p>
					))}
				</div>
			</Eclose.Content>
		</Eclose.Root>
	);
}
