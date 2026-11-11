export const SECTIONS = [
	{
		title: "Basics",
		pages: [
			{ title: "Getting Started", href: "/docs" },
			{ title: "API", href: "/docs/api" },
		],
	},
	{
		title: "Guides",
		pages: [
			{ title: "Origin", href: "/docs/origin" },
			{ title: "Styling", href: "/docs/styling" },
		],
	},
	{
		title: "Examples",
		pages: [{ title: "Anchored", href: "/docs/examples/anchored" }],
	},
];

export const DOCS = SECTIONS.flatMap((section) => section.pages);
