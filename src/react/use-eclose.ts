import {
	createContext,
	type RefObject,
	useContext,
	useEffect,
	useId,
	useInsertionEffect,
	useLayoutEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import {
	Controller,
	Flight,
	inertOthers,
	type Layer,
	lockScroll,
	Morph,
	type Phase,
	pageBox,
	pageRect,
	place,
	pushLayer,
	tabEdge,
	viewport,
	watch,
} from "../core";

// How React drives the core: the DOM always follows state, and a layout effect
// starts the motion once it's there. That keeps flushSync out of it, and means
// a controlled `open` prop takes exactly the same path as a click.

export const useIsoLayoutEffect =
	typeof document === "undefined" ? useEffect : useLayoutEffect;

const subscribe = () => () => {};

/** False on the server and during hydration, so both render the same markup. */
function useHydrated(): boolean {
	return useSyncExternalStore(
		subscribe,
		() => true,
		() => false,
	);
}

export interface RootOptions {
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (open: boolean) => void;
	/** Where the content rests: on top of its trigger, or in the viewport center. */
	placement?: "anchored" | "centered";
	/** Trap focus, make the page inert and lock scroll. Centered defaults to on. */
	modal?: boolean;
	/** Render into this element instead of the document body. */
	container?: HTMLElement | null;
}

interface Refs {
	trigger: HTMLElement | null;
	surface: HTMLElement | null;
	inner: HTMLElement | null;
	positioner: HTMLElement | null;
	overlay: HTMLElement | null;
	flightLayer: HTMLElement | null;
	morph: Morph | null;
	/** Shared elements are travelling, so the surface itself stays put. */
	flown: boolean;
}

/** One `Eclose.Shared` id: its element on the trigger's side and in the content. */
export interface SharedPair {
	source: HTMLElement | null;
	dest: HTMLElement | null;
}

export interface EcloseContext {
	open: boolean;
	present: boolean;
	phase: Phase;
	request: (open: boolean) => void;
	controller: Controller;
	refs: Refs;
	portal: HTMLElement | null;
	contentId: string;
	titleId: string;
	descriptionId: string;
	modal: boolean;
	centered: boolean;
	shared: Map<string, SharedPair>;
	live: RefObject<RootOptions>;
	/** Open on the first render, so it should appear without motion. */
	settleNext: RefObject<boolean>;
}

const Context = createContext<EcloseContext | null>(null);
/** The portal of the nearest open eclose, which a nested one renders inside. */
const ParentPortal = createContext<HTMLElement | null>(null);

export const EcloseProvider = Context.Provider;
export const ParentPortalProvider = ParentPortal.Provider;
/** Whether a part sits inside the content, which makes a Shared the destination. */
export const InContent = createContext(false);

export function useEclose(): EcloseContext {
	const context = useContext(Context);
	if (!context) throw new Error("eclose: parts must be inside Eclose.Root");
	return context;
}

function isModal({ modal, placement }: RootOptions): boolean {
	return modal ?? placement === "centered";
}

/** Puts anchored content in its resting place, over the trigger. */
function placeContent(refs: Refs, options: RootOptions): void {
	const { positioner, surface, trigger } = refs;
	if (options.placement === "centered" || !positioner || !surface) return;
	if (!trigger?.isConnected) return;
	// Clearing first means the origin is correct whatever the portal sits inside.
	positioner.style.transform = "";
	// Until now it's fixed, so an autofocused child can't scroll the page to it.
	positioner.style.position = "absolute";
	const origin = pageRect(positioner);
	const { x, y } = place(pageRect(trigger), pageRect(surface), viewport());
	positioner.style.transform = `translate(${x - origin.x}px, ${y - origin.y}px)`;
}

function createPortalRoot(): HTMLElement {
	const el = document.createElement("div");
	el.setAttribute("data-eclose", "");
	el.style.cssText =
		"position:absolute;top:0;left:0;z-index:var(--eclose-z,9999)";
	return el;
}

export function useRoot(options: RootOptions): EcloseContext {
	const [own, setOwn] = useState(!!options.defaultOpen);
	const open = options.open ?? own;
	const [phase, setPhase] = useState<Phase>("closed");
	const present = open || phase !== "closed";
	const hydrated = useHydrated();
	const parentPortal = useContext(ParentPortal);
	const contentId = useId();

	// Read from callbacks, which should always see the latest render.
	const live = useRef(options);
	live.current = options;

	const refs = useRef<Refs>({
		trigger: null,
		surface: null,
		inner: null,
		positioner: null,
		overlay: null,
		flightLayer: null,
		morph: null,
		flown: false,
	}).current;
	const shared = useRef(new Map<string, SharedPair>()).current;

	const requestRef = useRef((next: boolean) => {
		if (live.current.open === undefined) setOwn(next);
		live.current.onOpenChange?.(next);
	});

	const controllerRef = useRef<Controller | null>(null);
	controllerRef.current ??= new Controller({
		morph: () => refs.morph,
		commit: () => {},
		dismiss: false,
		layout: () => placeContent(refs, live.current),
		flights: () => {
			const flights: Flight[] = [];
			for (const pair of shared.values()) {
				if (pair.source && pair.dest) {
					flights.push(
						new Flight(
							() => pair.source,
							() => pair.dest,
							() => refs.flightLayer,
						),
					);
				}
			}
			refs.flown = flights.length > 0;
			return flights;
		},
		trigger: () => refs.trigger,
		surface: () => refs.surface,
		source: () => (refs.trigger?.isConnected ? refs.trigger : null),
		initialFocus: () => {
			const surface = refs.surface;
			if (!surface || surface.contains(document.activeElement)) return null;
			return surface.querySelector<HTMLElement>("[autofocus]") ?? surface;
		},
		onPhase: (next) => {
			setPhase(next);
			refs.surface?.toggleAttribute("inert", next === "closing");
			if (next === "open" && refs.overlay) refs.overlay.style.opacity = "";
			if (next === "closed" && refs.trigger) refs.trigger.style.opacity = "";
		},
	});

	const portalRef = useRef<HTMLElement | null>(null);
	const mounted = present && hydrated;
	if (mounted) portalRef.current ??= createPortalRoot();
	const portal = portalRef.current;

	// Before layout effects, so everything is in the document by measure time,
	// even a nested portal whose parent mounted in the same commit.
	useInsertionEffect(() => {
		if (!mounted || !portal) return;
		(options.container ?? parentPortal ?? document.body).append(portal);
		return () => portal.remove();
	}, [mounted, portal, options.container, parentPortal]);

	const settleNext = useRef(open);

	return {
		open,
		present: mounted,
		phase,
		request: requestRef.current,
		controller: controllerRef.current,
		refs,
		portal,
		contentId,
		titleId: `${contentId}t`,
		descriptionId: `${contentId}d`,
		modal: isModal(options),
		centered: options.placement === "centered",
		shared,
		live,
		settleNext,
	};
}

/** Lives as long as the content is mounted, and runs its motion. */
export function usePresence(context: EcloseContext): void {
	const {
		open,
		controller,
		refs,
		settleNext,
		portal,
		request,
		live,
		titleId,
		descriptionId,
	} = context;

	useIsoLayoutEffect(() => {
		const { surface, inner } = refs;
		if (!surface) return;
		const hideTrigger = (progress: number) => {
			// Hidden once the surface is opaque above it, so nothing dips.
			if (refs.trigger && !refs.flown) {
				refs.trigger.style.opacity = progress >= 25 ? "0" : "";
			}
		};
		const morph = new Morph(surface, {
			mode: "surface",
			inner,
			fade: true,
			onFrame: (m) => {
				hideTrigger(m.progress);
				if (refs.overlay) refs.overlay.style.opacity = `${m.progress / 100}`;
			},
		});
		refs.morph = morph;
		return () => {
			morph.destroy();
			refs.morph = null;
			controller.reset();
		};
	}, [controller, refs]);

	useIsoLayoutEffect(() => {
		// Only take focus back if nothing else has claimed it in the meantime.
		const returnFocus = () => {
			const active = document.activeElement;
			if (
				!active ||
				active === document.body ||
				refs.surface?.contains(active)
			) {
				refs.trigger?.focus({ preventScroll: true });
			}
		};

		if (!open) {
			settleNext.current = false;
			// Has to happen here. React puts focus back after running cleanups,
			// so anything moved there is undone while the element still exists.
			returnFocus();
			controller.close();
			return;
		}
		const surface = refs.surface;
		if (!surface || !portal) return;

		for (const [attribute, id] of [
			["aria-labelledby", titleId],
			["aria-describedby", descriptionId],
		]) {
			if (document.getElementById(id)) surface.setAttribute(attribute, id);
		}

		const modal = isModal(live.current);
		const layer: Layer = {
			surface: () => refs.surface,
			trigger: () => refs.trigger,
			modal,
			dismiss: () => request(false),
			tab: (e) => {
				const edge = tabEdge(e, surface);
				if (!edge) return;
				e.preventDefault();
				// Leaving a popover closes it, and focus goes back to its trigger.
				if (modal) edge.focus();
				else request(false);
			},
		};
		const popLayer = pushLayer(layer);
		const release = modal
			? [lockScroll(() => refs.surface), inertOthers(portal)]
			: [];

		// Something moved underneath: at rest it just gets placed again, and a
		// morph in the air bends toward wherever it should now end up.
		const follow = () => {
			const morph = refs.morph;
			const { trigger } = refs;
			if (!morph) return;
			if (controller.phase === "closing") {
				if (trigger?.isConnected && !refs.flown) {
					morph.retarget(pageBox(trigger));
				}
			} else if (morph.running) {
				morph.release();
				placeContent(refs, live.current);
				morph.retarget();
			} else if (!morph.held) {
				placeContent(refs, live.current);
			}
		};
		release.push(watch(() => refs.trigger, follow));

		// The surface's own size is being animated, so its children are what show
		// a real change in content height. Every observer reports once at the start.
		let reported = false;
		const resizes = new ResizeObserver(() => {
			if (reported) follow();
			reported = true;
		});
		for (const child of refs.inner?.children ?? []) resizes.observe(child);
		release.push(() => resizes.disconnect());

		if (settleNext.current) {
			placeContent(refs, live.current);
			controller.settle();
			if (refs.trigger && !refs.flown) refs.trigger.style.opacity = "0";
			(surface.querySelector<HTMLElement>("[autofocus]") ?? surface).focus({
				preventScroll: true,
			});
		} else {
			controller.open();
		}

		return () => {
			popLayer();
			for (const undo of release) undo();
			returnFocus();
		};
	}, [
		open,
		controller,
		refs,
		settleNext,
		portal,
		request,
		live,
		titleId,
		descriptionId,
	]);
}
