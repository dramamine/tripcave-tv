# Tripcave.tv

A multi-channel web experience featuring an audio visualizer, video player, and YouTube playlist integration. Set something up ahead of time, so that you have music & videos you like on your television.

Example site: https://tripcave.tv/

## Features

- **Config-Driven** - Easy channel management via JSON configuration
- **Music Visualizer** - Milkdrop visualizations with local files, drag-and-drop files, or microphone input
- **Video Channel** - Add videos, play in order or shuffe
- **YouTube Integration** - Embed a youTube playlists
- **Static Site** - No backend required, deploy anywhere


### Setup

```bash
npm install
```

### Configuration

1. Copy the example config:
   ```bash
   cp channels.json.example channels.json
   ```

2. Edit `channels.json` to customize your site name and channels

3. Add your media:
   - Audio files → `media/audio/` (for visualizer)
   - Video files → `media/video/` (for video channels)


### Building & Running Locally

```bash
npm run build
npm run preview
```

## Configuration

### Channel Types

- **milkdrop**: Audio visualizer, loads audio files from `media/{mediaFolder/`
- **video**: Video player, loads video files from `media/{mediaFolder}/`
- **youtube**: Embedded YouTube playlist

### Media Folders

Add media to your media folders. Some are included with this repo but you probably want to supply your own.

## License

MIT

## Credits

- Me: [dramamine](https://github.com/dramamine) https://metal-heart.org
- Butterchurn visualizer by [jberg](https://github.com/jberg/butterchurn)
- Milkdrop presets by the community
