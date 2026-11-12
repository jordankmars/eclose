// The same demos as App.tsx, built with the real components instead of driving
// the core by hand. Anything that works there and not here is an adapter bug.

import { Eclosion } from "../src/react";

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
			text="Eclosion.Shared flies the cover. The surface and overlay only fade."
			how="centered · shared · modal"
		>
			<div className="albums">
				{ALBUMS.map((a) => (
					<Eclosion.Root key={a.title} placement="centered">
						<Eclosion.Trigger className="album">
							<Eclosion.Shared
								id="cover"
								className="art"
								style={{ background: a.art }}
							/>
							<div>
								<b>{a.title}</b>
								<span>{a.artist}</span>
							</div>
						</Eclosion.Trigger>
						<Eclosion.Overlay className="ec-scrim" />
						<Eclosion.Content className="ec-detail">
							<Eclosion.Shared
								id="cover"
								className="hero"
								style={{ background: a.art }}
							/>
							<p className="meta">{a.meta}</p>
							<Eclosion.Title>{a.title}</Eclosion.Title>
							<Eclosion.Description className="text">
								{a.text}
							</Eclosion.Description>
							<div className="acts">
								<button type="button" className="btn primary">
									Play
								</button>
								<Eclosion.Close className="btn">Close</Eclosion.Close>
							</div>
						</Eclosion.Content>
					</Eclosion.Root>
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
			<Eclosion.Root>
				<Eclosion.Trigger className="pop pop-label">Share</Eclosion.Trigger>
				<Eclosion.Content className="ec-pop">
					<div className="pop-head">
						<Eclosion.Title className="ec-pop-title">
							Share “Q3 roadmap”
						</Eclosion.Title>
						<Eclosion.Close />
					</div>
					{["Copy link", "Send by email", "Post to #design"].map((item) => (
						<Eclosion.Close key={item} className="pop-item">
							{item}
						</Eclosion.Close>
					))}
				</Eclosion.Content>
			</Eclosion.Root>
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
			<Eclosion.Root>
				<Eclosion.Trigger className="ec-pill">Now playing</Eclosion.Trigger>
				<Eclosion.Content className="ec-music">
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
				</Eclosion.Content>
			</Eclosion.Root>
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
			<Eclosion.Root>
				<Eclosion.Trigger className="search s-icon" aria-label="Search">
					⌕
				</Eclosion.Trigger>
				<Eclosion.Content className="ec-search">
					<input
						className="ec-search-field"
						// biome-ignore lint/a11y/noAutofocus: the field is the whole point
						autoFocus
						placeholder="Search files"
						aria-label="Search files"
					/>
				</Eclosion.Content>
			</Eclosion.Root>
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
			<Eclosion.Root placement="centered">
				<Eclosion.Trigger className="btn">Open detail</Eclosion.Trigger>
				<Eclosion.Overlay className="ec-scrim" />
				<Eclosion.Content className="ec-detail">
					<Eclosion.Title>Detail</Eclosion.Title>
					<p className="text">Open the menu, then press Escape twice.</p>
					<div className="acts">
						<Eclosion.Root>
							<Eclosion.Trigger className="btn">More</Eclosion.Trigger>
							<Eclosion.Content className="ec-pop">
								<Eclosion.Close className="pop-item">Rename</Eclosion.Close>
								<Eclosion.Close className="pop-item">Duplicate</Eclosion.Close>
							</Eclosion.Content>
						</Eclosion.Root>
						<Eclosion.Close className="btn">Close</Eclosion.Close>
					</div>
				</Eclosion.Content>
			</Eclosion.Root>
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
			<Eclosion.Root placement="centered">
				<Eclosion.Trigger className="btn">Open sheet</Eclosion.Trigger>
				<Eclosion.Overlay className="ec-scrim" />
				<Eclosion.Content className="ec-detail ec-sheet">
					<Eclosion.Title>Tracks</Eclosion.Title>
					<div className="ec-list">
						{Array.from({ length: 30 }, (_, i) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: a fixed list
							<p key={i}>Track {i + 1}</p>
						))}
					</div>
				</Eclosion.Content>
			</Eclosion.Root>
		</Demo>
	);
}

export function ComponentDemos() {
	return (
		<>
			<header className="wrap top">
				<h1>Components</h1>
				<p>The same behaviour, through the public eclosion/react API.</p>
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
