
// this file is generated — do not edit it


declare module "svelte/elements" {
	export interface HTMLAttributes<T> {
		'data-sveltekit-keepfocus'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-noscroll'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-preload-code'?:
			| true
			| ''
			| 'eager'
			| 'viewport'
			| 'hover'
			| 'tap'
			| 'off'
			| undefined
			| null;
		'data-sveltekit-preload-data'?: true | '' | 'hover' | 'tap' | 'off' | undefined | null;
		'data-sveltekit-reload'?: true | '' | 'off' | undefined | null;
		'data-sveltekit-replacestate'?: true | '' | 'off' | undefined | null;
	}
}

export {};


declare module "$app/types" {
	export interface AppTypes {
		RouteId(): "/" | "/api" | "/api/media" | "/api/media/[folder]" | "/api/media/[folder]/[filename]" | "/api/music" | "/api/music/[filename]";
		RouteParams(): {
			"/api/media/[folder]": { folder: string };
			"/api/media/[folder]/[filename]": { folder: string; filename: string };
			"/api/music/[filename]": { filename: string }
		};
		LayoutParams(): {
			"/": { folder?: string; filename?: string };
			"/api": { folder?: string; filename?: string };
			"/api/media": { folder?: string; filename?: string };
			"/api/media/[folder]": { folder: string; filename?: string };
			"/api/media/[folder]/[filename]": { folder: string; filename: string };
			"/api/music": { filename?: string };
			"/api/music/[filename]": { filename: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/media" | "/api/media/" | `/api/media/${string}` & {} | `/api/media/${string}/` & {} | `/api/media/${string}/${string}` & {} | `/api/media/${string}/${string}/` & {} | "/api/music" | "/api/music/" | `/api/music/${string}` & {} | `/api/music/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/files.svg" | "/microphone.svg" | "/robots.txt" | "/youtube.svg" | string & {};
	}
}