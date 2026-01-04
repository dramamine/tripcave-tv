import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const mediaSource = path.join(rootDir, 'static', 'media');
const buildDir = path.join(rootDir, 'build');
const mediaDestination = path.join(buildDir, 'media');

// Valid browser-playable file extensions
const VALID_EXTENSIONS = [
	// Audio
	'.mp3', '.m4a', '.flac', '.ogg', '.wav', '.aac', '.opus',
	// Video
	'.mp4', '.webm', '.mkv', '.mov', '.avi',
	// HLS
	'.m3u8', '.ts'
];

console.log('\n📦 Setting up media files in build directory...\n');

if (!fs.existsSync(mediaSource)) {
	console.error('❌ Media folder not found:', mediaSource);
	process.exit(1);
}

if (!fs.existsSync(buildDir)) {
	console.error('❌ Build directory not found:', buildDir);
	console.error('   Run "npm run build" first to create the build directory.');
	process.exit(1);
}

// Remove existing media directory in build if it exists
if (fs.existsSync(mediaDestination)) {
	fs.rmSync(mediaDestination, { recursive: true, force: true });
}

// Try to create symlink, fallback to copying if it fails
try {
	fs.symlinkSync(mediaSource, mediaDestination, 'junction');
	console.log(`✓ Created symlink: build/media -> media/`);
	console.log('\n✅ Media symlink created successfully!\n');
	console.log('Note: When deploying, use rsync with -L flag to follow symlinks.\n');
} catch (error) {
	console.warn('⚠️  Symlink creation failed, falling back to copying files...\n');

	// Create media directory in build
	fs.mkdirSync(mediaDestination, { recursive: true });

	// Copy each media subfolder
	const mediaFolders = fs.readdirSync(mediaSource);
	let totalFiles = 0;

	mediaFolders.forEach(folder => {
		const sourcePath = path.join(mediaSource, folder);
		const destPath = path.join(mediaDestination, folder);

		if (!fs.statSync(sourcePath).isDirectory()) {
			return;
		}

		if (!fs.existsSync(destPath)) {
			fs.mkdirSync(destPath, { recursive: true });
		}

		const files = fs.readdirSync(sourcePath);
		let copiedCount = 0;

		files.forEach(file => {
			const sourceFile = path.join(sourcePath, file);
			const destFile = path.join(destPath, file);

			if (fs.statSync(sourceFile).isFile()) {
				const ext = path.extname(file).toLowerCase();
				if (VALID_EXTENSIONS.includes(ext)) {
					fs.copyFileSync(sourceFile, destFile);
					copiedCount++;
				}
			}
		});

		totalFiles += copiedCount;
		console.log(`✓ ${folder}/: ${copiedCount} files`);
	});

	console.log(`\n✅ Copied ${totalFiles} media files to build/media/\n`);
}
