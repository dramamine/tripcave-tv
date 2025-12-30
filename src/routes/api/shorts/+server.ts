import { json } from '@sveltejs/kit';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

export const GET: RequestHandler = async ({ url }) => {
	try {
		const randomize = url.searchParams.get('randomize') !== 'false';
		
		const shortsDir = join(process.cwd(), 'media', 'shorts');
		const files = await readdir(shortsDir);
		
		let videoFiles = files
			.filter(file => {
				const ext = file.toLowerCase().split('.').pop();
				return ext === 'mp4' || ext === 'webm' || ext === 'mkv' || ext === 'avi';
			})
			.sort();
		
		if (randomize) {
			videoFiles = shuffleArray(videoFiles);
		}
		
		return json(videoFiles);
	} catch (error) {
		console.error('Error reading shorts directory:', error);
		return json([]);
	}
};
