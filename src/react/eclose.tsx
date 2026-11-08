import {
	type ComponentPropsWithoutRef,
	type CSSProperties,
	cloneElement,
	createElement,
	forwardRef,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	type Ref,
	type RefObject,
	useContext,
	useRef,
} from "react";
import { createPortal } from "react-dom";
import {
	EcloseProvider,
	InContent,
	ParentPortalProvider,
	type RootOptions,
	type SharedPair,
	useEclose,
	useIsoLayoutEffect,
	usePresence,
	useRoot,
} from "./use-eclose";

type Props = Record<string, unknown>;

function assign<T>(ref: Ref<T> | undefined, value: T): void {
	if (typeof ref === "function") ref(value);
	else if (ref) ref.current = value;
}

function mergeRefs<T>(...refs: (Ref<T> | undefined)[]): (value: T) => void {
	return (value) => {
		for (const ref of refs) assign(ref, value);
	};
}

/** Lays our props under the child's, running both sets of event handlers. */
function mergeProps(ours: Props, theirs: Props): Props {
	const merged: Props = { ...ours, ...theirs };
	for (const key of Object.keys(ours)) {
		const a = ours[key];
		const b = theirs[key];
		if (/^on[A-Z]/.test(key) && typeof b === "function") {
			merged[key] = (...args: unknown[]) => {
				(b as (...a: unknown[]) => void)(...args);
				(a as (...a: unknown[]) => void)(...args);
			};
		}
	}
	merged.style = { ...(ours.style as object), ...(theirs.style as object) };
	if (ours.className && theirs.className) {
		merged.className = `${ours.className} ${theirs.className}`;
	}
	return merged;
}

/** Renders `tag`, or with `asChild` puts these props on the only child instead. */
function renderPart(
	tag: string,
	asChild: boolean | undefined,
	props: Props & { children?: ReactNode },
	ref: Ref<never>,
): ReactElement {
	const child = props.children;
	if (asChild && isValidElement<Props>(child)) {
		const childRef =
			(child.props.ref as Ref<never> | undefined) ??
			(child as unknown as { ref?: Ref<never> }).ref;
		const { children: _, ...rest } = props;
		return cloneElement(child, {
			...mergeProps(rest, child.props),
			ref: mergeRefs(ref, childRef),
		});
	}
	return createElement(tag, { ...props, ref });
}

export interface RootProps extends RootOptions {
	children?: ReactNode;
}

function Root({ children, ...options }: RootProps) {
	return (
		<EcloseProvider value={useRoot(options)}>
			<InContent.Provider value={false}>{children}</InContent.Provider>
		</EcloseProvider>
	);
}

interface AsChild {
	/** Put the behaviour on the only child instead of rendering a button. */
	asChild?: boolean;
}

export interface TriggerProps
	extends ComponentPropsWithoutRef<"button">,
		AsChild {}

const Trigger = forwardRef<HTMLButtonElement, TriggerProps>(function Trigger(
	{ asChild, onClick, ...props },
	ref,
) {
	const { open, phase, request, refs, contentId, present } = useEclose();
	const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		onClick?.(e);
		if (!e.defaultPrevented) request(!open);
	};
	return renderPart(
		"button",
		asChild,
		{
			type: asChild ? undefined : "button",
			"aria-haspopup": "dialog",
			"aria-expanded": open,
			"aria-controls": present ? contentId : undefined,
			"data-state": phase,
			...props,
			onClick: handleClick,
		},
		mergeRefs<HTMLElement | null>(ref as Ref<HTMLElement | null>, (el) => {
			// Inline refs detach on every render, so a null here doesn't mean it's gone.
			if (!el) return;
			refs.trigger = el;
			// A replacement mounted while open shouldn't show through.
			if (phase === "open" && !refs.flown) el.style.opacity = "0";
		}) as Ref<never>,
	);
});

export type CloseProps = TriggerProps;

const Close = forwardRef<HTMLButtonElement, CloseProps>(function Close(
	{ asChild, onClick, children, ...props },
	ref,
) {
	const { phase, request } = useEclose();
	const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
		onClick?.(e);
		if (!e.defaultPrevented) request(false);
	};
	return renderPart(
		"button",
		asChild,
		{
			type: asChild ? undefined : "button",
			"aria-label": children === undefined ? "Close" : undefined,
			"data-state": phase,
			...props,
			children: children ?? "×",
			onClick: handleClick,
		},
		ref as Ref<never>,
	);
});

export interface ContentProps extends ComponentPropsWithoutRef<"div"> {
	/** Takes focus on opening, ahead of an `autoFocus` child or the dialog. */
	initialFocus?: RefObject<HTMLElement | null>;
}

const POSITIONER: CSSProperties = {
	position: "fixed",
	pointerEvents: "none",
	zIndex: 1,
};
const CENTERED: CSSProperties = {
	...POSITIONER,
	inset: 0,
	display: "grid",
	placeItems: "center",
};
const FLIGHT_LAYER: CSSProperties = {
	position: "absolute",
	top: 0,
	left: 0,
	pointerEvents: "none",
	zIndex: 2,
};
const ANCHORED: CSSProperties = {
	...POSITIONER,
	top: 0,
	left: 0,
	width: "max-content",
};

function Presence() {
	usePresence(useEclose());
	return null;
}

const Content = forwardRef<HTMLDivElement, ContentProps>(function Content(
	{ children, style, initialFocus, ...props },
	ref,
) {
	const context = useEclose();
	const { present, portal, phase, refs, contentId, modal, centered } = context;
	refs.initialFocus = initialFocus;
	if (!present || !portal) return null;
	return createPortal(
		<ParentPortalProvider value={portal}>
			<InContent.Provider value={true}>
				<div
					ref={(el) => {
						if (el) refs.positioner = el;
					}}
					style={centered ? CENTERED : ANCHORED}
				>
					<div
						id={contentId}
						role="dialog"
						aria-modal={modal || undefined}
						tabIndex={-1}
						data-state={phase}
						{...props}
						ref={mergeRefs<HTMLDivElement | null>(ref, (el) => {
							if (el) refs.surface = el;
						})}
						style={{ outline: "none", pointerEvents: "auto", ...style }}
					>
						<div
							ref={(el) => {
								if (el) refs.inner = el;
							}}
							style={{ display: "contents" }}
						>
							{children}
						</div>
					</div>
				</div>
			</InContent.Provider>
			<div
				ref={(el) => {
					if (!el) return;
					refs.flightLayer = el;
					el.setAttribute("inert", "");
				}}
				aria-hidden
				style={FLIGHT_LAYER}
			/>
			<Presence />
		</ParentPortalProvider>,
		portal,
	);
});

export type OverlayProps = ComponentPropsWithoutRef<"div">;

const Overlay = forwardRef<HTMLDivElement, OverlayProps>(function Overlay(
	{ style, ...props },
	ref,
) {
	const { present, portal, phase, refs } = useEclose();
	if (!present || !portal) return null;
	return createPortal(
		<div
			aria-hidden
			data-state={phase}
			{...props}
			ref={mergeRefs<HTMLDivElement | null>(ref, (el) => {
				if (el) refs.overlay = el;
			})}
			style={{ position: "fixed", inset: 0, ...style }}
		/>,
		portal,
	);
});

export type TitleProps = ComponentPropsWithoutRef<"h2">;

const Title = forwardRef<HTMLHeadingElement, TitleProps>(
	function Title(props, ref) {
		return <h2 id={useEclose().titleId} {...props} ref={ref} />;
	},
);

export type DescriptionProps = ComponentPropsWithoutRef<"p">;

const Description = forwardRef<HTMLParagraphElement, DescriptionProps>(
	function Description(props, ref) {
		return <p id={useEclose().descriptionId} {...props} ref={ref} />;
	},
);

export interface SharedProps
	extends Omit<ComponentPropsWithoutRef<"div">, "id">,
		AsChild {
	/** Matches this element with the one of the same id on the other side. */
	id: string;
}

const Shared = forwardRef<HTMLDivElement, SharedProps>(function Shared(
	{ id, asChild, ...props },
	ref,
) {
	const { shared, controller } = useEclose();
	const inside = useContext(InContent);
	const own = useRef<HTMLElement | null>(null);

	useIsoLayoutEffect(() => {
		const el = own.current;
		if (!el) return;
		const side: keyof SharedPair = inside ? "dest" : "source";
		const pair = shared.get(id) ?? { source: null, dest: null };
		shared.set(id, pair);
		pair[side] = el;
		// A replacement mounted while open shouldn't show twice.
		if (!inside && controller.phase === "open") el.style.visibility = "hidden";
		return () => {
			if (pair[side] === el) pair[side] = null;
		};
	}, [shared, controller, id, inside]);

	return renderPart(
		"div",
		asChild,
		props,
		mergeRefs<HTMLElement | null>(
			ref as Ref<HTMLElement | null>,
			own,
		) as Ref<never>,
	);
});

export const Eclose = {
	Root,
	Trigger,
	Content,
	Close,
	Overlay,
	Title,
	Description,
	Shared,
};
