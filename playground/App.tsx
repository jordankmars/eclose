// A scratch page for the core. Each demo drives Morph directly from React,
// without the components, so engine changes can be checked as they land.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

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
			<main className="wrap grid" />
		</>
	);
}

createRoot(document.getElementById("root") as HTMLElement).render(
	<StrictMode>
		<App />
	</StrictMode>,
);
