"use client";

import { Eclosion } from "eclosion/react";

const albums = [
	{
		title: "Low Tide",
		artist: "Harbor Lights",
		meta: "Harbor Lights · 2026 · 11 tracks",
		text: "Slow, tidal synth records made over one winter on the coast. Best with headphones and the window open.",
		art: "linear-gradient(160deg,#0f4c5c,#5fa8a0 55%,#e3d9b8)",
	},
	{
		title: "Ember Season",
		artist: "Vesna",
		meta: "Vesna · 2025 · 9 tracks",
		text: "Warm brass and drum machines. The second side gets loud and stays there.",
		art: "linear-gradient(150deg,#3b0d11,#c2410c 50%,#fbbf24)",
	},
	{
		title: "Glasshouse",
		artist: "Orla Finch",
		meta: "Orla Finch · 2026 · 12 tracks",
		text: "Folk songs recorded in a greenhouse, rain on the roof included.",
		art: "linear-gradient(170deg,#14351f,#4d7c46 50%,#d9e8a8)",
	},
];

const muted = "text-neutral-500 dark:text-neutral-400";
const button = "rounded-[7px] px-3 py-[5px] text-[12.5px]";

export function CardToDetail() {
	return (
		<div className="flex w-full justify-center gap-5">
			{albums.map((album) => (
				<Eclosion.Root key={album.title} placement="centered">
					<Eclosion.Trigger className="group grid w-[min(170px,30%)] gap-2 rounded-xl text-left">
						<Eclosion.Shared
							id="cover"
							className="aspect-square rounded-xl group-hover:brightness-105"
							style={{ background: album.art }}
						/>
						<div>
							<b className="block text-[13px] font-medium">{album.title}</b>
							<span className={`text-xs ${muted}`}>{album.artist}</span>
						</div>
					</Eclosion.Trigger>
					<Eclosion.Overlay className="bg-[rgba(12,12,16,0.42)] dark:bg-black/60" />
					<Eclosion.Content className="group grid w-[min(440px,calc(100vw-32px))] gap-2.5 rounded-[22px] bg-white p-3 dark:bg-neutral-900">
						<Eclosion.Shared
							id="cover"
							className="h-[230px] rounded-[14px]"
							style={{ background: album.art }}
						/>
						<div className="grid gap-1.5 px-1.5 pb-1.5 transition-[opacity,translate] delay-140 duration-200 group-data-[state=closing]:opacity-0 group-data-[state=closing]:delay-0 group-data-[state=closing]:duration-100 starting:opacity-0 motion-safe:starting:translate-y-2">
							<p className={`font-mono text-[13px] ${muted}`}>{album.meta}</p>
							<Eclosion.Title className="text-xl font-semibold tracking-tight">
								{album.title}
							</Eclosion.Title>
							<Eclosion.Description className={`text-sm ${muted}`}>
								{album.text}
							</Eclosion.Description>
							<div className="mt-2 flex gap-1.5">
								<button
									type="button"
									className={`${button} bg-neutral-900 text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900`}
								>
									Play
								</button>
								<Eclosion.Close
									className={`${button} bg-neutral-100 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700`}
								>
									Close
								</Eclosion.Close>
							</div>
						</div>
					</Eclosion.Content>
				</Eclosion.Root>
			))}
		</div>
	);
}
