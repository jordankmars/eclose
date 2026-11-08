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
import { Controller, Morph, type Phase } from "../core";

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
	/** Render into this element instead of the document body. */
	container?: HTMLElement | null;
}

interface Refs {
	trigger: HTMLElement | null;
	surface: HTMLElement | null;
	inner: HTMLElement | null;
	morph: Morph | null;
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
	/** Open on the first render, so it should appear without motion. */
	settleNext: RefObject<boolean>;
}

const Context = createContext<EcloseContext | null>(null);
/** The portal of the nearest open eclose, which a nested one renders inside. */
const ParentPortal = createContext<HTMLElement | null>(null);

export const EcloseProvider = Context.Provider;
export const ParentPortalProvider = ParentPortal.Provider;

export function useEclose(): EcloseContext {
	const context = useContext(Context);
	if (!context) throw new Error("eclose: parts must be inside Eclose.Root");
	return context;
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
		morph: null,
	}).current;

	const requestRef = useRef((next: boolean) => {
		if (live.current.open === undefined) setOwn(next);
		live.current.onOpenChange?.(next);
	});

	const controllerRef = useRef<Controller | null>(null);
	controllerRef.current ??= new Controller({
		morph: () => refs.morph,
		commit: () => {},
		dismiss: false,
		trigger: () => refs.trigger,
		surface: () => refs.surface,
		source: () => refs.trigger,
		initialFocus: () => {
			const surface = refs.surface;
			if (!surface || surface.contains(document.activeElement)) return null;
			return surface.querySelector<HTMLElement>("[autofocus]") ?? surface;
		},
		onPhase: (next) => {
			setPhase(next);
			refs.surface?.toggleAttribute("inert", next === "closing");
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
		settleNext,
	};
}

/** Lives as long as the content is mounted, and runs its motion. */
export function usePresence(context: EcloseContext): void {
	const { open, controller, refs, settleNext } = context;

	useIsoLayoutEffect(() => {
		const { surface, inner } = refs;
		if (!surface) return;
		const hideTrigger = (progress: number) => {
			// Hidden once the surface is opaque above it, so nothing dips.
			if (refs.trigger) {
				refs.trigger.style.opacity = progress >= 25 ? "0" : "";
			}
		};
		const morph = new Morph(surface, {
			mode: "surface",
			inner,
			fade: true,
			onFrame: (m) => hideTrigger(m.progress),
		});
		refs.morph = morph;
		return () => {
			morph.destroy();
			refs.morph = null;
			controller.reset();
		};
	}, [controller, refs]);

	useIsoLayoutEffect(() => {
		if (!open) {
			settleNext.current = false;
			controller.close();
			return;
		}
		if (settleNext.current) {
			controller.settle();
			if (refs.trigger) refs.trigger.style.opacity = "0";
		} else {
			controller.open();
		}
	}, [open, controller, refs, settleNext]);
}
