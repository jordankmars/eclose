import type { Origin } from "eclosion/react";
import { highlight } from "@/lib/highlight";
import { ORIGINS, originCode } from "./examples/origin-code";
import { OriginPicker } from "./examples/origin-picker";

/** Highlights every variant at build time, so the picker can swap between them. */
export async function OriginExample() {
	const entries = await Promise.all(
		ORIGINS.map(async (origin) => {
			const code = originCode(origin);
			return [origin, { html: await highlight(code), code }] as const;
		}),
	);
	return (
		<OriginPicker
			variants={
				Object.fromEntries(entries) as Record<
					Origin,
					{ html: string; code: string }
				>
			}
		/>
	);
}
