// The same demos as App.tsx, built with the real components instead of driving
// the core by hand. Anything that works there and not here is an adapter bug.

import { Eclose } from "../src/react";

const ALBUMS = [
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

function Demo({
	title,
	text,
	how,
	wide,
	children,
}: {
	title: string;
	text: string;
	how: string;
	wide?: boolean;
	children: React.ReactNode;
}) {
	return (
		<section className={wide ? "demo wide" : "demo"}>
			<div className="demo-h">
				<h2>{title}</h2>
				<p>{text}</p>
			</div>
			<div className="stage">{children}</div>
			<div className="demo-f">
				<span className="how">{how}</span>
			</div>
		</section>
	);
}

function CardToDetail() {
	return (
		<Demo
			wide
			title="Card to detail"
			text="Eclose.Shared flies the cover. The surface and overlay only fade."
			how="centered · shared · modal"
		>
			<div className="albums">
				{ALBUMS.map((a) => (
					<Eclose.Root key={a.title} placement="centered">
						<Eclose.Trigger className="album">
							<Eclose.Shared
								id="cover"
								className="art"
								style={{ background: a.art }}
							/>
							<div>
								<b>{a.title}</b>
								<span>{a.artist}</span>
							</div>
						</Eclose.Trigger>
						<Eclose.Overlay className="ec-scrim" />
						<Eclose.Content className="ec-detail">
							<Eclose.Shared
								id="cover"
								className="hero"
								style={{ background: a.art }}
							/>
							<p className="meta">{a.meta}</p>
							<Eclose.Title>{a.title}</Eclose.Title>
							<Eclose.Description className="text">{a.text}</Eclose.Description>
							<div className="acts">
								<button type="button" className="btn primary">
									Play
								</button>
								<Eclose.Close className="btn">Close</Eclose.Close>
							</div>
						</Eclose.Content>
					</Eclose.Root>
				))}
			</div>
		</Demo>
	);
}

function Popover() {
	return (
		<Demo
			title="Button to popover"
			text="The surface grows out of the button. It has a border and shadow on purpose."
			how="anchored · surface morph"
		>
			<Eclose.Root>
				<Eclose.Trigger className="pop pop-label">Share</Eclose.Trigger>
				<Eclose.Content className="ec-pop">
					<div className="pop-head">
						<Eclose.Title className="ec-pop-title">
							Share “Q3 roadmap”
						</Eclose.Title>
						<Eclose.Close />
					</div>
					{["Copy link", "Send by email", "Post to #design"].map((item) => (
						<Eclose.Close key={item} className="pop-item">
							{item}
						</Eclose.Close>
					))}
				</Eclose.Content>
			</Eclose.Root>
		</Demo>
	);
}

function Pill() {
	return (
		<Demo
			title="Expanding pill"
			text="A status pill that becomes a live activity."
			how="anchored · grows from the pill"
		>
			<Eclose.Root>
				<Eclose.Trigger className="ec-pill">Now playing</Eclose.Trigger>
				<Eclose.Content className="ec-music">
					<div className="is-art" />
					<div className="is-meta">
						<b>Low Tide</b>
						<span>Harbor Lights</span>
					</div>
					<div className="is-bar">
						<span>1:12</span>
						<div />
						<span>3:08</span>
					</div>
				</Eclose.Content>
			</Eclose.Root>
		</Demo>
	);
}

function Search() {
	return (
		<Demo
			title="Search field"
			text="An icon button that widens into a focused field."
			how="anchored · autoFocus"
		>
			<Eclose.Root>
				<Eclose.Trigger className="search s-icon" aria-label="Search">
					⌕
				</Eclose.Trigger>
				<Eclose.Content className="ec-search">
					<input
						className="ec-search-field"
						// biome-ignore lint/a11y/noAutofocus: the field is the whole point
						autoFocus
						placeholder="Search files"
						aria-label="Search files"
					/>
				</Eclose.Content>
			</Eclose.Root>
		</Demo>
	);
}

function Nested() {
	return (
		<Demo
			title="Nested"
			text="A menu inside a detail view. Escape closes one layer at a time."
			how="modal with a popover inside"
		>
			<Eclose.Root placement="centered">
				<Eclose.Trigger className="btn">Open detail</Eclose.Trigger>
				<Eclose.Overlay className="ec-scrim" />
				<Eclose.Content className="ec-detail">
					<Eclose.Title>Detail</Eclose.Title>
					<p className="text">Open the menu, then press Escape twice.</p>
					<div className="acts">
						<Eclose.Root>
							<Eclose.Trigger className="btn">More</Eclose.Trigger>
							<Eclose.Content className="ec-pop">
								<Eclose.Close className="pop-item">Rename</Eclose.Close>
								<Eclose.Close className="pop-item">Duplicate</Eclose.Close>
							</Eclose.Content>
						</Eclose.Root>
						<Eclose.Close className="btn">Close</Eclose.Close>
					</div>
				</Eclose.Content>
			</Eclose.Root>
		</Demo>
	);
}

function ScrollingSwipe() {
	return (
		<Demo
			title="Swipe and scroll"
			text="On touch, pull down to dismiss. The list scrolls first, and only a pull from its top dismisses."
			how="swipe yields to inner scrolling"
		>
			<Eclose.Root placement="centered">
				<Eclose.Trigger className="btn">Open sheet</Eclose.Trigger>
				<Eclose.Overlay className="ec-scrim" />
				<Eclose.Content className="ec-detail ec-sheet">
					<Eclose.Title>Tracks</Eclose.Title>
					<div className="ec-list">
						{Array.from({ length: 30 }, (_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
							<p key={i}>Track {i + 1}</p>
						))}
					</div>
				</Eclose.Content>
			</Eclose.Root>
		</Demo>
	);
}

export function ComponentDemos() {
	return (
		<>
			<header className="wrap top">
				<h1>Components</h1>
				<p>The same behaviour, through the public eclose/react API.</p>
			</header>
			<main className="wrap grid">
				<CardToDetail />
				<Popover />
				<Pill />
				<Search />
				<Nested />
				<ScrollingSwipe />
			</main>
		</>
	);
}
