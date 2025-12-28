import { json } from '@sveltejs/kit';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const musicDir = join(process.cwd(), 'media', 'music');
		const files = await readdir(musicDir);

		// Filter for audio files and sort
		const audioFiles = files
			.filter(file => file.endsWith('.mp3') || file.endsWith('.m4a') || file.endsWith('.wav') || file.endsWith('.ogg'))
			.sort();

		return json(audioFiles);
	} catch (error) {
		console.error('Error reading music directory:', error);
		return json([]);
	}
};
