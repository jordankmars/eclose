import {
	type ComponentPropsWithoutRef,
	cloneElement,
	createElement,
	forwardRef,
	isValidElement,
	type MouseEvent,
	type ReactElement,
	type ReactNode,
	type Ref,
} from "react";
import { createPortal } from "react-dom";
import {
	EcloseProvider,
	ParentPortalProvider,
	type RootOptions,
	useEclose,
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
	return <EcloseProvider value={useRoot(options)}>{children}</EcloseProvider>;
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
			refs.trigger = el;
			// A replacement mounted while open shouldn't show through.
			if (el && phase === "open") el.style.opacity = "0";
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

export type ContentProps = ComponentPropsWithoutRef<"div">;

function Presence() {
	usePresence(useEclose());
	return null;
}

const Content = forwardRef<HTMLDivElement, ContentProps>(function Content(
	{ children, style, ...props },
	ref,
) {
	const context = useEclose();
	const { present, portal, phase, refs, contentId } = context;
	if (!present || !portal) return null;
	return createPortal(
		<ParentPortalProvider value={portal}>
			<div
				style={{
					position: "fixed",
					inset: 0,
					display: "grid",
					placeItems: "center",
					pointerEvents: "none",
					zIndex: 1,
				}}
			>
				<div
					id={contentId}
					role="dialog"
					tabIndex={-1}
					data-state={phase}
					{...props}
					ref={mergeRefs<HTMLDivElement | null>(ref, (el) => {
						refs.surface = el;
					})}
					style={{ outline: "none", pointerEvents: "auto", ...style }}
				>
					<div
						ref={(el) => {
							refs.inner = el;
						}}
						style={{ display: "contents" }}
					>
						{children}
					</div>
				</div>
			</div>
			<Presence />
		</ParentPortalProvider>,
		portal,
	);
});

export const Eclose = { Root, Trigger, Content, Close };
