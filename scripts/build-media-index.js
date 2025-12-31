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
	const mediaPath = path.join(rootDir, 'media', folderName);
	
	if (!fs.existsSync(mediaPath)) {
		console.warn(`⚠️  Media folder not found: ${mediaPath}`);
		return [];
	}

	const validExtensions = getValidExtensions(folderName);
	const files = fs.readdirSync(mediaPath);
	
	const filteredFiles = files.filter(file => {
		const ext = path.extname(file).toLowerCase();
		return validExtensions.includes(ext);
	});

	// Sort alphabetically by default
	filteredFiles.sort();

	console.log(`✓ ${folderName}: ${filteredFiles.length} files`);
	return filteredFiles;
}

// Create static directory if it doesn't exist
const staticMediaDir = path.join(rootDir, 'static', 'media-index');
if (!fs.existsSync(staticMediaDir)) {
	fs.mkdirSync(staticMediaDir, { recursive: true });
}

// Build index for each media folder
console.log('\n🔨 Building media index files...\n');

mediaFolders.forEach(folderName => {
	const files = scanMediaFolder(folderName);
	const outputPath = path.join(staticMediaDir, `${folderName}.json`);
	
	fs.writeFileSync(outputPath, JSON.stringify(files, null, 2), 'utf-8');
	console.log(`   → static/media-index/${folderName}.json`);
});

console.log('\n✅ Media index build complete!\n');
