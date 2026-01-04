import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// Video extensions to process
const VIDEO_EXTENSIONS = ['.mp4', '.webm', '.mkv', '.mov', '.avi'];

// Parse command line arguments
const args = process.argv.slice(2);
const overwrite = args.includes('--overwrite') || args.includes('-f');

console.log('\n🎬 Batch HLS Transcoding\n');
console.log(`Mode: ${overwrite ? 'OVERWRITE' : 'SKIP EXISTING'}\n`);

/**
 * Check if HLS files already exist for a video
 */
function hasExistingTranscode(outputDir) {
	const masterPlaylist = path.join(outputDir, 'master.m3u8');
	const playlist1080 = path.join(outputDir, '1080p.m3u8');
	const playlist720 = path.join(outputDir, '720p.m3u8');
	const playlist480 = path.join(outputDir, '480p.m3u8');

	return fs.existsSync(masterPlaylist) &&
		   fs.existsSync(playlist1080) &&
		   fs.existsSync(playlist720) &&
		   fs.existsSync(playlist480);
}

/**
 * Find all video files recursively in a directory
 */
function findVideoFiles(dir) {
	const videos = [];

	function scan(currentDir) {
		const items = fs.readdirSync(currentDir, { withFileTypes: true });

		for (const item of items) {
			const fullPath = path.join(currentDir, item.name);

			if (item.isDirectory()) {
				scan(fullPath);
			} else if (item.isFile()) {
				const ext = path.extname(item.name).toLowerCase();
				if (VIDEO_EXTENSIONS.includes(ext)) {
					videos.push(fullPath);
				}
			}
		}
	}

	scan(dir);
	return videos;
}

/**
 * Transcode a single video file
 */
function transcodeVideo(inputPath) {
	const dir = path.dirname(inputPath);
	const basename = path.basename(inputPath);
	const nameWithoutExt = path.parse(basename).name;
	const outputDir = path.join(dir, nameWithoutExt);

	// Check if transcodes already exist
	if (!overwrite && hasExistingTranscode(outputDir)) {
		console.log(`⏭️  SKIP: ${path.relative(rootDir, inputPath)}`);
		console.log(`   (HLS files already exist in ${path.relative(rootDir, outputDir)})`);
		return { status: 'skipped', input: inputPath, output: outputDir };
	}

	console.log(`\n${'='.repeat(70)}`);
	console.log(`🎥 Processing: ${path.relative(rootDir, inputPath)}`);
	console.log(`📁 Output: ${path.relative(rootDir, outputDir)}`);
	console.log(`${'='.repeat(70)}\n`);

	// Create output directory
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	// Run transcode script
	const scriptPath = path.join(__dirname, 'transcode-to-hls.sh');
	
	try {
		// Check if we're on Windows and use bash or wsl
		let command;
		if (process.platform === 'win32') {
			// Try to use Git Bash or WSL
			if (fs.existsSync('C:\\Program Files\\Git\\bin\\bash.exe')) {
				command = `"C:\\Program Files\\Git\\bin\\bash.exe" "${scriptPath}" "${inputPath}" "${outputDir}"`;
			} else {
				command = `wsl bash "${scriptPath.replace(/\\/g, '/')}" "${inputPath.replace(/\\/g, '/')}" "${outputDir.replace(/\\/g, '/')}"`;
			}
		} else {
			command = `bash "${scriptPath}" "${inputPath}" "${outputDir}"`;
		}

		execSync(command, { stdio: 'inherit' });
		
		console.log(`\n✅ SUCCESS: ${basename}\n`);
		return { status: 'success', input: inputPath, output: outputDir };
	} catch (error) {
		console.error(`\n❌ FAILED: ${basename}`);
		console.error(`Error: ${error.message}\n`);
		return { status: 'failed', input: inputPath, output: outputDir, error: error.message };
	}
}

/**
 * Main execution
 */
function main() {
	const mediaDir = path.join(rootDir, 'static', 'media');

	if (!fs.existsSync(mediaDir)) {
		console.error('❌ Media directory not found:', mediaDir);
		process.exit(1);
	}

	// Check if ffmpeg is available
	try {
		execSync('ffmpeg -version', { stdio: 'ignore' });
	} catch (error) {
		console.error('❌ ffmpeg not found. Please install ffmpeg first.');
		console.error('   Windows: choco install ffmpeg');
		console.error('   Mac: brew install ffmpeg');
		console.error('   Linux: apt-get install ffmpeg');
		process.exit(1);
	}

	// Find all video files
	console.log('🔍 Scanning for video files...\n');
	const videoFiles = findVideoFiles(mediaDir);

	if (videoFiles.length === 0) {
		console.log('No video files found in media directory.');
		process.exit(0);
	}

	console.log(`Found ${videoFiles.length} video file(s):\n`);
	videoFiles.forEach((file, index) => {
		console.log(`  ${index + 1}. ${path.relative(rootDir, file)}`);
	});
	console.log('');

	// Process each video
	const results = {
		success: [],
		skipped: [],
		failed: []
	};

	for (const videoFile of videoFiles) {
		const result = transcodeVideo(videoFile);
		results[result.status].push(result);
	}

	// Summary
	console.log('\n' + '='.repeat(70));
	console.log('📊 SUMMARY');
	console.log('='.repeat(70) + '\n');
	console.log(`✅ Success:  ${results.success.length}`);
	console.log(`⏭️  Skipped:  ${results.skipped.length}`);
	console.log(`❌ Failed:   ${results.failed.length}`);
	console.log(`📁 Total:    ${videoFiles.length}\n`);

	if (results.failed.length > 0) {
		console.log('Failed videos:');
		results.failed.forEach(r => {
			console.log(`  - ${path.relative(rootDir, r.input)}`);
		});
		console.log('');
	}

	if (results.skipped.length > 0 && !overwrite) {
		console.log('💡 Tip: Use --overwrite flag to re-encode existing videos\n');
	}

	process.exit(results.failed.length > 0 ? 1 : 0);
}

main();
