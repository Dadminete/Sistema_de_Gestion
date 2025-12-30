/// <reference types="vite/client" />

// Type declarations for Vite PWA virtual module
declare module 'virtual:pwa-register' {
	export function registerSW(options?: { immediate?: boolean }): void;
}
