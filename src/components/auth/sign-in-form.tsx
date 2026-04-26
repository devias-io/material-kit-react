"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { GithubLogoIcon, GoogleLogoIcon } from "@phosphor-icons/react";

import { authClient } from "@/lib/auth/client";

export function SignInForm(): React.JSX.Element {
	return (
		<Box
			sx={{
				backgroundColor: "var(--mui-palette-background-paper)",
				border: "1px solid var(--mui-palette-divider)",
				borderRadius: "8px",
				boxShadow: "0 18px 45px rgba(15, 23, 42, 0.08)",
				p: { xs: 3, sm: 4 },
			}}
		>
			<Stack spacing={4}>
				<Stack spacing={1} sx={{ textAlign: "center" }}>
					<Typography variant="h4">Welcome back</Typography>
					<Typography color="text.secondary" variant="body2">
						Sign in to your expense dashboard
					</Typography>
				</Stack>
				<Stack direction="row" justifyContent="center" spacing={2}>
					<IconButton
						aria-label="Login with GitHub"
						component="a"
						href={authClient.getOAuthAuthorizationUrl("github")}
						size="large"
						sx={{
							border: "1px solid var(--mui-palette-divider)",
							borderRadius: "8px",
							height: 56,
							width: 56,
							"&:hover": {
								backgroundColor: "var(--mui-palette-background-level1)",
								borderColor: "var(--mui-palette-neutral-400)",
							},
						}}
					>
						<GithubLogoIcon color="black" fontSize="var(--icon-fontSize-lg)" />
					</IconButton>
					<IconButton
						aria-label="Login with Google"
						component="a"
						href={authClient.getOAuthAuthorizationUrl("google")}
						size="large"
						sx={{
							border: "1px solid var(--mui-palette-divider)",
							borderRadius: "8px",
							height: 56,
							width: 56,
							"&:hover": {
								backgroundColor: "var(--mui-palette-background-level1)",
								borderColor: "var(--mui-palette-neutral-400)",
							},
						}}
					>
						<GoogleLogoIcon color="#DB4437" fontSize="var(--icon-fontSize-lg)" />
					</IconButton>
				</Stack>
			</Stack>
		</Box>
	);
}
