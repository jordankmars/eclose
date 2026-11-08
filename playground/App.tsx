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
