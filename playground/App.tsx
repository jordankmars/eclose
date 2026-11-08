// A scratch page for the core. Each demo drives Morph directly from React,
// without the components, so engine changes can be checked as they land.
//
// The pattern throughout: a Morph lives for as long as its element is mounted,
// and React state changes happen inside morph()'s mutate callback through
// flushSync, so the DOM has really changed by the time it gets measured.

import {
	type PointerEvent,
	type RefObject,
	StrictMode,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import {
	configure,
	Morph,
	type MorphOptions,
	morph,
	pageBox,
} from "../src/core";

function useMorph<T extends HTMLElement>(
	options: () => MorphOptions = () => ({}),
): [RefObject<T | null>, RefObject<Morph | null>] {
	const el = useRef<T>(null);
	const m = useRef<Morph>(null);
	// biome-ignore lint/correctness/useExhaustiveDependencies: built once per mount
	useEffect(() => {
		if (!el.current) return;
		const instance = new Morph(el.current, options());
		m.current = instance;
		return () => {
			instance.destroy();
			m.current = null;
		};
	}, []);
	return [el, m];
}

/** Runs a React state change as a morph. */
function morphState(morphs: (Morph | null)[], update: () => void) {
	const ready = morphs.filter((m): m is Morph => m !== null);
	morph(ready, () => flushSync(update));
}

function Chips<T extends string>({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: [T, string][];
	value: T;
	onChange: (value: T) => void;
}) {
	return (
		<fieldset className="chips" aria-label={label}>
			{options.map(([v, text]) => (
				<button
					key={v}
					type="button"
					aria-pressed={v === value}
					onClick={() => v !== value && onChange(v)}
				>
					{text}
				</button>
			))}
		</fieldset>
	);
}

// ---------- Card to detail ----------

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

function CardToDetail() {
	// `open` is which album the overlay shows; `shown` drives the fade, and
	// lags behind `open` so the overlay can play its exit before it hides.
	const [open, setOpen] = useState<number | null>(null);
	const [shown, setShown] = useState(false);
	const closing = useRef(false);
	const cards = useRef<(HTMLButtonElement | null)[]>([]);
	const arts = useRef<(HTMLDivElement | null)[]>([]);
	const overlay = useRef<HTMLDivElement>(null);
	const closeButton = useRef<HTMLButtonElement>(null);
	const [hero, heroM] = useMorph<HTMLDivElement>();

	function openDetail(i: number) {
		const art = arts.current[i];
		const m = heroM.current;
		if (open !== null || !art || !m) return;
		const from = pageBox(art);
		flushSync(() => setOpen(i));
		// Commit the hidden state before fading in, or there's nothing to fade from.
		void overlay.current?.offsetWidth;
		flushSync(() => setShown(true));
		m.release();
		m.go(from, m.measure());
		closeButton.current?.focus({ preventScroll: true });
	}

	const closeDetail = useCallback(() => {
		if (open === null || closing.current) return;
		const art = arts.current[open];
		const m = heroM.current;
		if (!art || !m) return;
		closing.current = true;
		setShown(false);
		m.to(pageBox(art), () => {
			closing.current = false;
			setOpen(null);
			cards.current[open]?.focus({ preventScroll: true });
		});
	}, [open, heroM]);

	useEffect(() => {
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") closeDetail();
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [closeDetail]);

	const album = open === null ? null : ALBUMS[open];

	return (
		<section className="demo wide">
			<div className="demo-h">
				<h2>Card to detail</h2>
				<p>
					The cover leaves the grid and becomes the header of the detail view,
					then flies back when you close it.
				</p>
			</div>
			<div className="stage">
				<div className="albums">
					{ALBUMS.map((a, i) => (
						<button
							type="button"
							key={a.title}
							className="album"
							ref={(el) => {
								cards.current[i] = el;
							}}
							onClick={() => openDetail(i)}
						>
							<div
								className="art"
								ref={(el) => {
									arts.current[i] = el;
								}}
								style={{
									background: a.art,
									visibility: open === i ? "hidden" : undefined,
								}}
							/>
							<div>
								<b>{a.title}</b>
								<span>{a.artist}</span>
							</div>
						</button>
					))}
				</div>
			</div>
			<div className="demo-f">
				<span className="how">
					shared element · two nodes · radius corrected
				</span>
				<span className="how">
					Click a cover. Esc or the backdrop closes it.
				</span>
			</div>

			<div
				className={shown ? "ov in" : "ov"}
				ref={overlay}
				hidden={open === null}
			>
				<div className="ov-scrim" onPointerDown={closeDetail} />
				<div
					className="detail"
					role="dialog"
					aria-modal="true"
					aria-labelledby="d-title"
				>
					<div className="detail-bg" />
					<div className="hero" ref={hero} style={{ background: album?.art }} />
					<div className="detail-body">
						<p className="meta">{album?.meta}</p>
						<h3 id="d-title">{album?.title}</h3>
						<p className="text">{album?.text}</p>
						<div className="acts">
							<button type="button" className="btn primary">
								Play
							</button>
							<button
								type="button"
								className="btn"
								ref={closeButton}
								onClick={closeDetail}
							>
								Close
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}

// ---------- Button to popover ----------

function Popover() {
	const [open, setOpen] = useState(false);
	const openRef = useRef(open);
	openRef.current = open;
	const inner = useRef<HTMLDivElement>(null);
	const label = useRef<HTMLButtonElement>(null);
	const firstItem = useRef<HTMLButtonElement>(null);
	const [pop, popM] = useMorph<HTMLDivElement>(() => ({
		counter: inner.current,
	}));

	const setPop = useCallback(
		(next: boolean, returnFocus = false) => {
			if (openRef.current === next) return;
			morphState([popM.current], () => setOpen(next));
			if (next) firstItem.current?.focus({ preventScroll: true });
			else if (returnFocus) label.current?.focus({ preventScroll: true });
		},
		[popM],
	);

	useEffect(() => {
		const onDown = (e: globalThis.PointerEvent) => {
			if (!pop.current?.contains(e.target as Node)) setPop(false);
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") setPop(false, true);
		};
		document.addEventListener("pointerdown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [pop, setPop]);

	return (
		<section className="demo">
			<div className="demo-h">
				<h2>Button to popover</h2>
				<p>
					The trigger opens into its own menu, so the menu clearly comes from
					it.
				</p>
			</div>
			<div className="stage">
				<div className={open ? "pop open" : "pop"} ref={pop}>
					<div ref={inner}>
						<button
							type="button"
							className="pop-label"
							ref={label}
							aria-expanded={open}
							hidden={open}
							onClick={() => setPop(true)}
						>
							<svg
								width="15"
								height="15"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								aria-hidden="true"
							>
								<path d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7" />
								<path d="M12 3v13" />
								<path d="m7 8 5-5 5 5" />
							</svg>
							Share
						</button>
						<div className="pop-panel" hidden={!open}>
							<div className="pop-head">
								<span>Share “Q3 roadmap”</span>
								<button
									type="button"
									aria-label="Close"
									onClick={() => setPop(false, true)}
								>
									<svg
										width="12"
										height="12"
										viewBox="0 0 24 24"
										fill="none"
										stroke="currentColor"
										strokeWidth="2.5"
										strokeLinecap="round"
										aria-hidden="true"
									>
										<path d="M6 6l12 12M18 6 6 18" />
									</svg>
								</button>
							</div>
							{["Copy link", "Send by email", "Post to #design"].map(
								(item, i) => (
									<button
										type="button"
										key={item}
										className="pop-item"
										ref={i === 0 ? firstItem : undefined}
										onClick={() => setPop(false, true)}
									>
										{item}
										{i === 0 && <kbd>⌘C</kbd>}
									</button>
								),
							)}
						</div>
					</div>
				</div>
			</div>
			<div className="demo-f">
				<span className="how">
					transform · counter-scaled content · crossfade
				</span>
			</div>
		</section>
	);
}

// ---------- Expanding pill ----------

type PillState = "idle" | "timer" | "music";

function Pill() {
	const [state, setState] = useState<PillState>("idle");
	const [pill, pillM] = useMorph<HTMLDivElement>(() => ({ mode: "size" }));

	return (
		<section className="demo">
			<div className="demo-h">
				<h2>Expanding pill</h2>
				<p>
					A status pill that grows into a live activity. Try the Bouncy spring
					here.
				</p>
			</div>
			<div className="stage phone">
				<div className="status">
					<span>9:41</span>
					<i>5G ▮▮▮</i>
				</div>
				<div className="island" ref={pill} data-state={state}>
					<div className="is-c is-timer">
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							aria-hidden="true"
						>
							<circle cx="12" cy="13" r="8" />
							<path d="M12 9v4l2 2M9 2h6" />
						</svg>
						<span>04:59</span>
					</div>
					<div className="is-c is-music">
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
					</div>
				</div>
			</div>
			<div className="demo-f">
				<span className="how">
					size mode · content clipped, never stretched
				</span>
				<Chips
					label="Pill state"
					options={[
						["idle", "Idle"],
						["timer", "Timer"],
						["music", "Music"],
					]}
					value={state}
					onChange={(v) => morphState([pillM.current], () => setState(v))}
				/>
			</div>
		</section>
	);
}

// ---------- Search field ----------

function Search() {
	const [open, setOpen] = useState(false);
	const [query, setQuery] = useState("");
	const live = useRef({ open, query });
	live.current = { open, query };
	const input = useRef<HTMLInputElement>(null);
	const [search, searchM] = useMorph<HTMLDivElement>(() => ({ mode: "size" }));

	const setSearch = useCallback(
		(next: boolean) => {
			if (live.current.open === next) return;
			morphState([searchM.current], () => setOpen(next));
			if (next) input.current?.focus({ preventScroll: true });
			else input.current?.blur();
		},
		[searchM],
	);

	// Leaving an empty field closes it. One with a query stays open.
	useEffect(() => {
		const onDown = (e: globalThis.PointerEvent) => {
			if (!search.current?.contains(e.target as Node) && !live.current.query) {
				setSearch(false);
			}
		};
		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape" && !live.current.query) setSearch(false);
		};
		document.addEventListener("pointerdown", onDown);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("pointerdown", onDown);
			document.removeEventListener("keydown", onKey);
		};
	}, [search, setSearch]);

	return (
		<section className="demo">
			<div className="demo-h">
				<h2>Search field</h2>
				<p>
					An icon button that widens into a field and closes again when you
					leave it empty.
				</p>
			</div>
			<div className="stage">
				<div className={open ? "search open" : "search"} ref={search}>
					<button
						type="button"
						className="s-icon"
						aria-label="Search"
						onClick={() => setSearch(!open || !!query)}
					>
						<svg
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2.2"
							strokeLinecap="round"
							aria-hidden="true"
						>
							<circle cx="11" cy="11" r="7" />
							<path d="m20 20-3.5-3.5" />
						</svg>
					</button>
					<input
						ref={input}
						type="text"
						placeholder="Search files"
						aria-label="Search files"
						tabIndex={open ? 0 : -1}
						value={query}
						onChange={(e) => setQuery(e.target.value)}
					/>
				</div>
			</div>
			<div className="demo-f">
				<span className="how">size mode · width only</span>
			</div>
		</section>
	);
}

// ---------- Corner correction ----------

function Avatar({
	open,
	onToggle,
	m,
	el,
}: {
	open: boolean;
	onToggle: () => void;
	m: RefObject<HTMLButtonElement | null>;
	el: RefObject<HTMLDivElement | null>;
}) {
	return (
		<button
			type="button"
			className={open ? "av open" : "av"}
			ref={m}
			onClick={onToggle}
		>
			<div className="av-in" ref={el}>
				<i>MK</i>
				<div className="av-text">
					<b>Mara Kim</b>
					<span>Motion designer</span>
				</div>
			</div>
		</button>
	);
}

function CornerCorrection() {
	const [open, setOpen] = useState(false);
	const innerA = useRef<HTMLDivElement>(null);
	const innerB = useRef<HTMLDivElement>(null);
	const [a, aM] = useMorph<HTMLButtonElement>(() => ({
		counter: innerA.current,
	}));
	const [b, bM] = useMorph<HTMLButtonElement>(() => ({
		counter: innerB.current,
		radius: false,
	}));

	const toggle = () =>
		morphState([aM.current, bM.current], () => setOpen((o) => !o));

	return (
		<section className="demo">
			<div className="demo-h">
				<h2>Corner correction</h2>
				<p>
					A circle opening into a card. Plain FLIP scales the final corners, so
					they squash at the start.
				</p>
			</div>
			<div className="stage">
				<div className="pair">
					<div className="half">
						<span>Corrected</span>
						<div>
							<Avatar open={open} onToggle={toggle} m={a} el={innerA} />
						</div>
					</div>
					<div className="half">
						<span>Plain FLIP</span>
						<div>
							<Avatar open={open} onToggle={toggle} m={b} el={innerB} />
						</div>
					</div>
				</div>
			</div>
			<div className="demo-f">
				<span className="how">radius ÷ scale, per axis</span>
				<div className="acts">
					<button type="button" className="btn" onClick={toggle}>
						Toggle both
					</button>
				</div>
			</div>
		</section>
	);
}

// ---------- Interruption ----------

const PUCK = 48;

function Interruption() {
	const pad = useRef<HTMLDivElement>(null);
	const canvas = useRef<HTMLCanvasElement>(null);
	const trail = useRef<[number, number][]>([]);
	const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
	const [handoff, setHandoff] = useState<"keep" | "restart">("keep");

	function drawTrail() {
		const c = canvas.current;
		const p = pad.current;
		const ctx = c?.getContext("2d");
		if (!c || !p || !ctx) return;
		const r = p.getBoundingClientRect();
		const points = trail.current;
		ctx.clearRect(0, 0, r.width, r.height);
		if (points.length < 2) return;
		ctx.strokeStyle = getComputedStyle(p).getPropertyValue("--accent").trim();
		ctx.lineWidth = 2;
		ctx.lineCap = "round";
		for (let i = 1; i < points.length; i++) {
			ctx.globalAlpha = (i / points.length) * 0.85;
			ctx.beginPath();
			ctx.moveTo(...points[i - 1]);
			ctx.lineTo(...points[i]);
			ctx.stroke();
		}
		ctx.globalAlpha = 1;
	}

	const [puck, puckM] = useMorph<HTMLDivElement>(() => ({
		onFrame(m) {
			const p = pad.current;
			if (!p) return;
			const r = p.getBoundingClientRect();
			const b = m.current();
			trail.current.push([
				b.x - (r.left + scrollX) + b.w / 2,
				b.y - (r.top + scrollY) + b.h / 2,
			]);
			if (trail.current.length > 140) trail.current.shift();
			drawTrail();
		},
	}));

	// Start centred, and keep the canvas matched to the pad at device resolution.
	// biome-ignore lint/correctness/useExhaustiveDependencies: drawTrail only reads refs
	useEffect(() => {
		const p = pad.current;
		if (!p) return;
		const r = p.getBoundingClientRect();
		setPos({ x: (r.width - PUCK) / 2, y: (r.height - PUCK) / 2 });
		const ro = new ResizeObserver(() => {
			const c = canvas.current;
			const ctx = c?.getContext("2d");
			if (!c || !ctx) return;
			const box = p.getBoundingClientRect();
			const d = devicePixelRatio || 1;
			c.width = Math.round(box.width * d);
			c.height = Math.round(box.height * d);
			ctx.setTransform(d, 0, 0, d, 0, 0);
			drawTrail();
		});
		ro.observe(p);
		return () => ro.disconnect();
	}, []);

	function onPointerDown(e: PointerEvent<HTMLDivElement>) {
		const r = e.currentTarget.getBoundingClientRect();
		const x = Math.min(
			Math.max(e.clientX - r.left - PUCK / 2, 8),
			r.width - PUCK - 8,
		);
		const y = Math.min(
			Math.max(e.clientY - r.top - PUCK / 2, 8),
			r.height - PUCK - 8,
		);
		if (!puckM.current?.running) trail.current.length = 0;
		morphState([puckM.current], () => setPos({ x, y }));
	}

	return (
		<section className="demo">
			<div className="demo-h">
				<h2>Interruption</h2>
				<p>
					Click around the pad quickly. Keeping velocity curves through each
					change. Restarting turns a sharp corner every time.
				</p>
			</div>
			<div className="stage pad" ref={pad} onPointerDown={onPointerDown}>
				<canvas ref={canvas} />
				<div
					className="puck"
					ref={puck}
					style={pos ? { left: pos.x, top: pos.y } : { visibility: "hidden" }}
				/>
				<span className="hint">Click anywhere, several times in a row</span>
			</div>
			<div className="demo-f">
				<span className="how">retarget mid-flight</span>
				<Chips
					label="On interrupt"
					options={[
						["keep", "Keep velocity"],
						["restart", "Restart"],
					]}
					value={handoff}
					onChange={(v) => {
						setHandoff(v);
						if (puckM.current) puckM.current.options.handoff = v === "keep";
					}}
				/>
			</div>
		</section>
	);
}

// ---------- Controls ----------

const snappy = { duration: 0.32, bounce: 0 };
const SPRINGS = {
	snappy,
	bouncy: { ...snappy, bounce: 0.32 },
};

function Controls() {
	const [spring, setSpring] = useState<keyof typeof SPRINGS>("snappy");
	const [speed, setSpeed] = useState<"1" | "0.25">("1");
	const [motion, setMotion] = useState<"full" | "reduced">(() =>
		matchMedia("(prefers-reduced-motion: reduce)").matches ? "reduced" : "full",
	);

	useEffect(() => configure(SPRINGS[spring]), [spring]);
	useEffect(() => configure({ speed: Number(speed) }), [speed]);
	useEffect(() => {
		configure({ reduced: motion === "reduced" });
		document.documentElement.classList.toggle("reduced", motion === "reduced");
	}, [motion]);

	return (
		<div className="bar">
			<div className="wrap">
				<div className="ctl">
					<span>Spring</span>
					<Chips
						label="Spring"
						options={[
							["snappy", "Snappy"],
							["bouncy", "Bouncy"],
						]}
						value={spring}
						onChange={setSpring}
					/>
				</div>
				<div className="ctl">
					<span>Speed</span>
					<Chips
						label="Speed"
						options={[
							["1", "1×"],
							["0.25", "¼×"],
						]}
						value={speed}
						onChange={setSpeed}
					/>
				</div>
				<div className="ctl">
					<span>Motion</span>
					<Chips
						label="Motion"
						options={[
							["full", "Full"],
							["reduced", "Reduced"],
						]}
						value={motion}
						onChange={setMotion}
					/>
				</div>
			</div>
		</div>
	);
}

function App() {
	return (
		<>
			<header className="wrap top">
				<h1>eclose playground</h1>
				<p>
					The core engine, driven straight from React. Click again mid-flight
					and the motion should bend toward the new target instead of
					restarting.
				</p>
			</header>
			<Controls />
			<main className="wrap grid">
				<CardToDetail />
				<Popover />
				<Pill />
				<Search />
				<CornerCorrection />
				<Interruption />
			</main>
		</>
	);
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
