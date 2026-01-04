import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Read the channels config to find all media folders
const channelsPath = path.join(rootDir, 'channels.json');
const channelsData = JSON.parse(fs.readFileSync(channelsPath, 'utf-8'));

// Extract unique media folders from channels
const mediaFolders = new Set();
channelsData.channels.forEach(channel => {
	if (channel.mediaFolder) {
		mediaFolders.add(channel.mediaFolder);
	}
});

// Add 'music' folder for milkdrop visualizer
mediaFolders.add('music');

// Valid file extensions for each type
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.avi'];
const AUDIO_EXTENSIONS = ['.mp3', '.flac', '.wav', '.ogg', '.m4a'];

function getValidExtensions(folderName) {
	if (folderName === 'music') {
		return AUDIO_EXTENSIONS;
	}
	return VIDEO_EXTENSIONS;
}

function scanMediaFolder(folderName) {
	const mediaPath = path.join(rootDir, 'static', 'media', folderName);
	
	if (!fs.existsSync(mediaPath)) {
		console.warn(`⚠️  Media folder not found: ${mediaPath}`);
		return [];
	}

	const validExtensions = getValidExtensions(folderName);
	const files = fs.readdirSync(mediaPath);
	
	const mediaItems = [];
	let hlsCount = 0;
	let rawCount = 0;

	files.forEach(file => {
		const ext = path.extname(file).toLowerCase();
		
		// Only process video/audio files
		if (!validExtensions.includes(ext)) {
			return;
		}

		const nameWithoutExt = path.parse(file).name;
		const hlsFolder = path.join(mediaPath, nameWithoutExt);
		const hlsPlaylist = path.join(hlsFolder, 'master.m3u8');

		// Check if HLS transcode exists
		if (fs.existsSync(hlsPlaylist)) {
			// Use HLS stream
			mediaItems.push({
				file: file,
				hls: `${nameWithoutExt}/master.m3u8`
			});
			hlsCount++;
		} else {
			// Use raw file - omit hls property to save space
			mediaItems.push({
				file: file
			});
			rawCount++;
		}
	});

	// Sort alphabetically by filename
	mediaItems.sort((a, b) => a.file.localeCompare(b.file));

	console.log(`✓ ${folderName}: ${mediaItems.length} files (${hlsCount} HLS, ${rawCount} raw)`);
	return mediaItems;
}

// Create static directory if it doesn't exist
const staticMediaDir = path.join(rootDir, 'static', 'media-index');
if (!fs.existsSync(staticMediaDir)) {
	fs.mkdirSync(staticMediaDir, { recursive: true });
}

// Build index for each media folder
console.log('\n🔨 Building media index files...\n');

let totalHls = 0;
let totalRaw = 0;

mediaFolders.forEach(folderName => {
	const mediaItems = scanMediaFolder(folderName);
	const outputPath = path.join(staticMediaDir, `${folderName}.json`);
	
	// Count HLS vs raw
	const hlsInFolder = mediaItems.filter(item => item.hls).length;
	const rawInFolder = mediaItems.filter(item => !item.hls).length;
	totalHls += hlsInFolder;
	totalRaw += rawInFolder;
	
	fs.writeFileSync(outputPath, JSON.stringify(mediaItems, null, 2), 'utf-8');
	console.log(`   → static/media-index/${folderName}.json`);
});

console.log('\n📊 Summary:');
console.log(`   HLS streams: ${totalHls}`);
console.log(`   Raw files:   ${totalRaw}`);
console.log(`   Total:       ${totalHls + totalRaw}`);
console.log('\n✅ Media index build complete!\n');
