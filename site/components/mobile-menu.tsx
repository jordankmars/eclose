"use client";

import { Eclosion } from "eclosion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SECTIONS } from "@/lib/docs";
import { external, GITHUB_URL } from "@/lib/links";
import { ghostButton } from "./ghost-button";
import { CloseIcon, MenuIcon } from "./icons";

const label = "px-2 text-xs font-medium text-neutral-500 dark:text-neutral-400";
const link = "block rounded-md px-2 py-2 text-[15px] font-medium";
const active = "bg-neutral-100 dark:bg-neutral-800";

/** The site's navigation below `md`, grown out of its own menu button. */
export function MobileMenu() {
	const pathname = usePathname();
	return (
		<div className="-ml-2 md:hidden">
			<Eclosion.Root origin="top-left" modal>
				<Eclosion.Trigger aria-label="Open menu" className={ghostButton}>
					<MenuIcon className="size-5" />
				</Eclosion.Trigger>
				<Eclosion.Overlay className="bg-black/30" />
				<Eclosion.Content className="max-h-[calc(100dvh-24px)] w-[calc(100vw-16px)] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 dark:border-neutral-800 dark:bg-neutral-950">
					<div className="flex items-center justify-between">
						<Eclosion.Title className="px-2 text-lg font-semibold tracking-tight">
							Menu
						</Eclosion.Title>
						<Eclosion.Close aria-label="Close menu" className={ghostButton}>
							<CloseIcon className="size-4" />
						</Eclosion.Close>
					</div>
					<div className="mt-2 grid gap-5 pb-2">
						<ul>
							<li>
								<Eclosion.Close asChild>
									<Link
										href="/"
										aria-current={pathname === "/" ? "page" : undefined}
										className={`${link} ${pathname === "/" ? active : ""}`}
									>
										Home
									</Link>
								</Eclosion.Close>
							</li>
							<li>
								<Eclosion.Close asChild>
									<a href={GITHUB_URL} {...external} className={link}>
										GitHub
									</a>
								</Eclosion.Close>
							</li>
						</ul>
						{SECTIONS.map((section) => (
							<div key={section.title}>
								<p className={label}>{section.title}</p>
								<ul className="mt-1">
									{section.pages.map((doc) => (
										<li key={doc.href}>
											<Eclosion.Close asChild>
												<Link
													href={doc.href}
													aria-current={
														pathname === doc.href ? "page" : undefined
													}
													className={`${link} ${
														pathname === doc.href ? active : ""
													}`}
												>
													{doc.title}
												</Link>
											</Eclosion.Close>
										</li>
									))}
								</ul>
							</div>
						))}
					</div>
				</Eclosion.Content>
			</Eclosion.Root>
		</div>
	);
}
