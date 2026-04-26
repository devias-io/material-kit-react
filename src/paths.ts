export const paths = {
	home: "/",
	auth: { signIn: "/auth/sign-in" },
	dashboard: {
		overview: "/dashboard",
		transactions: "/dashboard/transactions",
		shareCalculator: "/dashboard/account",
		categories: "/dashboard/category-studio",
		categorySplitSettings: "/dashboard/integrations",
		autoCategorization: "/dashboard/auto-categorization",
		settings: "/dashboard/settings",
	},
	errors: { notFound: "/errors/not-found" },
} as const;
