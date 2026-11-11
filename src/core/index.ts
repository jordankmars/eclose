// Framework-agnostic core. Internal: not exported on its own.

export {
	alignment,
	type Origin,
	type Point,
	place,
	viewport,
	watch,
} from "./anchor";
export { morph } from "./batch";
export { configure, isReduced, type MotionConfig } from "./config";
export { Controller, type ControllerOptions, type Phase } from "./controller";
export { Flight } from "./flight";
export { tabbables, tabEdge } from "./focus";
export type { Box, Rect } from "./geometry";
export { pageBox, pageRect } from "./geometry";
export { inertOthers } from "./inert";
export { isTop, type Layer, pushLayer } from "./layers";
export { lockScroll } from "./lock";
export { Morph, type MorphOptions } from "./morph";
export { swipe } from "./swipe";
