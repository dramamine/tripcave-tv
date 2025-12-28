import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const videosDir = join(process.cwd(), 'media', 'musicvideos');
		const filePath = join(videosDir, params.filename);

		// Security: prevent directory traversal
		if (!filePath.startsWith(videosDir)) {
			throw error(403, 'Forbidden');
		}

		const fileBuffer = await readFile(filePath);

		// Determine content type
		let contentType = 'video/mp4';
		if (params.filename.endsWith('.webm')) contentType = 'video/webm';
		if (params.filename.endsWith('.mkv')) contentType = 'video/x-matroska';
		if (params.filename.endsWith('.avi')) contentType = 'video/x-msvideo';

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString()
			}
		});
	} catch (err) {
		console.error('Error serving video file:', err);
		throw error(404, 'File not found');
	}
};
