import { UseEclosionMenu } from "@/components/use-eclosion-menu";
import { AUTHOR_URL, external } from "@/lib/links";

export default function Home() {
	return (
		<main className="flex flex-1 justify-center px-4 pt-24 pb-16 sm:pt-40">
			<div className="flex flex-col items-center text-center">
				{/*
				 * The chip is absolutely positioned, so only the word is centered.
				 * It's sized in the hero's ems: with a line height of 1, Inter's
				 * baseline sits 0.137em above the bottom of the line.
				 */}
				<div className="relative text-6xl leading-none sm:text-7xl">
					<h1 className="font-semibold tracking-tight">Eclosion</h1>
					<span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 sm:top-auto sm:bottom-[0.137em] sm:left-full sm:mt-0 sm:ml-3 sm:translate-x-0">
						<a
							href={AUTHOR_URL}
							{...external}
							className="block rounded-full text-xs border border-neutral-200 px-2.5 py-0.5 leading-4 whitespace-nowrap text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-900 dark:border-neutral-800 dark:text-neutral-400 dark:hover:border-neutral-700 dark:hover:text-neutral-100"
						>
							by jordan mars
						</a>
					</span>
				</div>
				<p className="mt-12 max-w-md text-lg text-balance text-neutral-500 sm:mt-4 dark:text-neutral-400">
					A dialog or popover that grows out of its trigger.
				</p>
				<div className="mt-8">
					<UseEclosionMenu />
				</div>
			</div>
		</main>
	);
}
