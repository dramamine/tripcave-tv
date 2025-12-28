import { error } from '@sveltejs/kit';
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const musicDir = join(process.cwd(), 'media', 'music');
		const filePath = join(musicDir, params.filename);

		// Security: prevent directory traversal
		if (!filePath.startsWith(musicDir)) {
			throw error(403, 'Forbidden');
		}

		const fileBuffer = await readFile(filePath);

		// Determine content type
		let contentType = 'audio/mpeg';
		if (params.filename.endsWith('.m4a')) contentType = 'audio/mp4';
		if (params.filename.endsWith('.wav')) contentType = 'audio/wav';
		if (params.filename.endsWith('.ogg')) contentType = 'audio/ogg';

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': contentType,
				'Content-Length': fileBuffer.length.toString()
			}
		});
	} catch (err) {
		console.error('Error serving music file:', err);
		throw error(404, 'File not found');
	}
};
