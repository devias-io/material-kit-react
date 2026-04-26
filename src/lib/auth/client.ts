"use client";

import type { User } from "@/types/user";

function generateToken(): string {
	const arr = new Uint8Array(12);
	globalThis.crypto.getRandomValues(arr);
	return Array.from(arr, (v) => v.toString(16).padStart(2, "0")).join("");
}

export interface SignUpParams {
	firstName: string;
	lastName: string;
	email: string;
	password: string;
}

export interface SignInWithOAuthParams {
	provider: "github" | "google" | "discord";
}

export interface SignInWithPasswordParams {
	email: string;
	password: string;
}

export interface ResetPasswordParams {
	email: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";
const USER_ENDPOINT = process.env.NEXT_PUBLIC_AUTH_USER_ENDPOINT ?? "/user";

function getString(value: unknown): string | undefined {
	return typeof value === "string" && value.length > 0 ? value : undefined;
}

function getRecord(value: unknown): Record<string, unknown> {
	return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function normalizeUser(payload: unknown): User | null {
	const root = getRecord(payload);
	const principal = getRecord(root.principal);
	const attributes = getRecord(root.attributes ?? principal.attributes ?? root);

	const id = getString(root.id) ?? getString(root.name) ?? getString(principal.name) ?? getString(attributes.id);
	const name = getString(root.name) ?? getString(attributes.name) ?? getString(attributes.login);

	if (!id && !name) {
		return null;
	}

	return {
		id: id ?? name ?? "authenticated-user",
		name,
		avatar: getString(root.avatar) ?? getString(attributes.avatar_url) ?? getString(attributes.picture),
		email: getString(root.email) ?? getString(attributes.email),
	};
}

class AuthClient {
	async signUp(_: SignUpParams): Promise<{ error?: string }> {
		// Make API request

		// We do not handle the API, so we'll just generate a token and store it in localStorage.
		const token = generateToken();
		localStorage.setItem("custom-auth-token", token);

		return {};
	}

	async signInWithOAuth(params: SignInWithOAuthParams): Promise<{ error?: string }> {
		globalThis.location.assign(this.getOAuthAuthorizationUrl(params.provider));

		return {};
	}

	getOAuthAuthorizationUrl(provider: SignInWithOAuthParams["provider"]): string {
		return new URL(`/oauth2/authorization/${provider}`, API_BASE_URL).toString();
	}

	async signInWithPassword(params: SignInWithPasswordParams): Promise<{ error?: string }> {
		const { email, password } = params;

		// Make API request

		// We do not handle the API, so we'll check if the credentials match with the hardcoded ones.
		if (email !== "sofia@devias.io" || password !== "Secret1") {
			return { error: "Invalid credentials" };
		}

		const token = generateToken();
		localStorage.setItem("custom-auth-token", token);

		return {};
	}

	async resetPassword(_: ResetPasswordParams): Promise<{ error?: string }> {
		return { error: "Password reset not implemented" };
	}

	async updatePassword(_: ResetPasswordParams): Promise<{ error?: string }> {
		return { error: "Update reset not implemented" };
	}

	async getUser(): Promise<{ data?: User | null; error?: string }> {
		const url = new URL(USER_ENDPOINT, API_BASE_URL);
		const response = await fetch(url, {
			credentials: "include",
			headers: { Accept: "application/json" },
			redirect: "manual",
		});

		if (response.status === 401 || response.status === 403 || response.type === "opaqueredirect") {
			return { data: null };
		}

		if (!response.ok) {
			return { error: "Unable to load the current user" };
		}

		const payload = (await response.json()) as unknown;

		return { data: normalizeUser(payload) };
	}

	async signOut(): Promise<{ error?: string }> {
		localStorage.removeItem("custom-auth-token");

		return {};
	}
}

export const authClient = new AuthClient();
