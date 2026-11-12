import type { Origin } from "eclosion/react";

export const ORIGINS: Origin[] = [
	"top-left",
	"top",
	"top-right",
	"left",
	"center",
	"right",
	"bottom-left",
	"bottom",
	"bottom-right",
];

export const originCode = (
	origin: Origin,
) => `import { Eclosion } from "eclosion/react";

export function Example() {
	return (
		<Eclosion.Root origin="${origin}">
			<Eclosion.Trigger>Open</Eclosion.Trigger>
			<Eclosion.Content>
				<Eclosion.Title>${origin}</Eclosion.Title>
				<Eclosion.Close />
			</Eclosion.Content>
		</Eclosion.Root>
	);
}`;
