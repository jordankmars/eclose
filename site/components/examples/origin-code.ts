import type { Origin } from "eclose/react";

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
) => `import { Eclose } from "eclose/react";

export function Example() {
	return (
		<Eclose.Root origin="${origin}">
			<Eclose.Trigger>Open</Eclose.Trigger>
			<Eclose.Content>
				<Eclose.Title>${origin}</Eclose.Title>
				<Eclose.Close />
			</Eclose.Content>
		</Eclose.Root>
	);
}`;
