"use client";

import { Eclosion, type Origin } from "eclosion/react";
import { useState } from "react";
import { ExampleTabs } from "../example-tabs";
import { ORIGINS } from "./origin-code";

export function OriginPicker({
	variants,
}: {
	variants: Record<Origin, { html: string; code: string }>;
}) {
	const [origin, setOrigin] = useState<Origin>("center");

	const view = (
		<>
			<Eclosion.Root origin={origin}>
				<Eclosion.Trigger className="h-9 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-neutral-50 dark:bg-neutral-100 dark:text-neutral-900">
					Open
				</Eclosion.Trigger>
				<Eclosion.Content className="grid h-32 w-52 content-between rounded-2xl border border-neutral-200 bg-white p-3 text-sm shadow-lg dark:border-neutral-800 dark:bg-neutral-900">
					<div className="flex items-center justify-between">
						<Eclosion.Title className="font-mono text-xs">
							{origin}
						</Eclosion.Title>
						<Eclosion.Close className="text-neutral-500 dark:text-neutral-400" />
					</div>
					<p className="text-xs text-neutral-500 dark:text-neutral-400">
						Grows from here.
					</p>
				</Eclosion.Content>
			</Eclosion.Root>
			<fieldset className="absolute bottom-4 left-4 grid w-fit grid-cols-3 gap-1">
				<legend className="sr-only">Origin</legend>
				{ORIGINS.map((value) => (
					<label key={value} className="block cursor-pointer" title={value}>
						<input
							type="radio"
							name="origin"
							value={value}
							aria-label={value}
							checked={origin === value}
							onChange={() => setOrigin(value)}
							className="peer sr-only"
						/>
						<span className="block size-5 rounded border border-neutral-300 peer-checked:border-neutral-900 peer-checked:bg-neutral-900 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-1 peer-focus-visible:outline-neutral-400 dark:border-neutral-700 dark:peer-checked:border-neutral-100 dark:peer-checked:bg-neutral-100" />
					</label>
				))}
			</fieldset>
		</>
	);

	return <ExampleTabs view={view} {...variants[origin]} />;
}
