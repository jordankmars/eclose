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
import { Morph, type MorphOptions, morph } from "../src/core";

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
			<main className="wrap grid">
				<Popover />
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
