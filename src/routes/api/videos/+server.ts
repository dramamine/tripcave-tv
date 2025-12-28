import { json } from '@sveltejs/kit';
import { readdir } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		const videosDir = join(process.cwd(), 'media', 'musicvideos');
		const files = await readdir(videosDir);
		
		// Filter for video files
		const videoFiles = files.filter(file => 
			file.endsWith('.mp4') || 
			file.endsWith('.webm') || 
			file.endsWith('.mkv') ||
			file.endsWith('.avi')
		);
		
		return json(videoFiles.sort());
	} catch (error) {
		console.error('Error reading videos directory:', error);
		return json([]);
	}
};
