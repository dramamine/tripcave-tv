import { error } from '@sveltejs/kit';
import { createReadStream, existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join } from 'path';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params }) => {
	const filename = params.filename;
	
	// Security: prevent directory traversal
	if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
		throw error(400, 'Invalid filename');
	}
	
	const filePath = join(process.cwd(), 'media', 'shorts', filename);
	
	if (!existsSync(filePath)) {
		throw error(404, 'Video not found');
	}
	
	const stats = await stat(filePath);
	const ext = filename.toLowerCase().split('.').pop();
	
	const mimeTypes: Record<string, string> = {
		mp4: 'video/mp4',
		webm: 'video/webm',
		mkv: 'video/x-matroska',
		avi: 'video/x-msvideo'
	};
	
	const contentType = mimeTypes[ext || 'mp4'] || 'video/mp4';
	
	const stream = createReadStream(filePath);
	
	return new Response(stream as any, {
		headers: {
			'Content-Type': contentType,
			'Content-Length': stats.size.toString(),
			'Accept-Ranges': 'bytes'
		}
	});
};
