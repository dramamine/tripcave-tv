
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
		RouteId(): "/" | "/api" | "/api/music" | "/api/music/[filename]" | "/api/shorts" | "/api/shorts/[filename]" | "/api/videos" | "/api/videos/[filename]";
		RouteParams(): {
			"/api/music/[filename]": { filename: string };
			"/api/shorts/[filename]": { filename: string };
			"/api/videos/[filename]": { filename: string }
		};
		LayoutParams(): {
			"/": { filename?: string };
			"/api": { filename?: string };
			"/api/music": { filename?: string };
			"/api/music/[filename]": { filename: string };
			"/api/shorts": { filename?: string };
			"/api/shorts/[filename]": { filename: string };
			"/api/videos": { filename?: string };
			"/api/videos/[filename]": { filename: string }
		};
		Pathname(): "/" | "/api" | "/api/" | "/api/music" | "/api/music/" | `/api/music/${string}` & {} | `/api/music/${string}/` & {} | "/api/shorts" | "/api/shorts/" | `/api/shorts/${string}` & {} | `/api/shorts/${string}/` & {} | "/api/videos" | "/api/videos/" | `/api/videos/${string}` & {} | `/api/videos/${string}/` & {};
		ResolvedPathname(): `${"" | `/${string}`}${ReturnType<AppTypes['Pathname']>}`;
		Asset(): "/files.svg" | "/microphone.svg" | "/robots.txt" | "/youtube.svg" | string & {};
	}
}