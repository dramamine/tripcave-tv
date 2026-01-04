#!/bin/bash

# Transcode videos to HLS format with multiple quality levels
# Usage: ./transcode-to-hls.sh input.mp4 output_folder

if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <input_video> <output_folder>"
    echo "Example: $0 video.mp4 ../static/media/musicvideos/video1"
    exit 1
fi

INPUT="$1"
OUTPUT_DIR="$2"

# Create output directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "Transcoding $INPUT to HLS format..."
echo "Output directory: $OUTPUT_DIR"

# Generate HLS streams with multiple quality levels in one pass
ffmpeg -i "$INPUT" \
  -filter_complex \
  "[0:v]split=3[v1][v2][v3]; \
   [v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease:force_divisible_by=2[v1out]; \
   [v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease:force_divisible_by=2[v2out]; \
   [v3]scale=w=854:h=480:force_original_aspect_ratio=decrease:force_divisible_by=2[v3out]" \
  -map "[v1out]" -c:v:0 libx264 -b:v:0 5000k -maxrate:v:0 5000k -bufsize:v:0 10000k \
    -preset slow -g 48 -sc_threshold 0 \
    -map 0:a? -c:a:0 aac -b:a:0 192k -ac 2 \
    -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$OUTPUT_DIR/1080p_%03d.ts" \
    "$OUTPUT_DIR/1080p.m3u8" \
  -map "[v2out]" -c:v:1 libx264 -b:v:1 2800k -maxrate:v:1 2800k -bufsize:v:1 5600k \
    -preset slow -g 48 -sc_threshold 0 \
    -map 0:a? -c:a:1 aac -b:a:1 128k -ac 2 \
    -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$OUTPUT_DIR/720p_%03d.ts" \
    "$OUTPUT_DIR/720p.m3u8" \
  -map "[v3out]" -c:v:2 libx264 -b:v:2 1400k -maxrate:v:2 1400k -bufsize:v:2 2800k \
    -preset slow -g 48 -sc_threshold 0 \
    -map 0:a? -c:a:2 aac -b:a:2 96k -ac 2 \
    -f hls -hls_time 4 -hls_playlist_type vod -hls_segment_filename "$OUTPUT_DIR/480p_%03d.ts" \
    "$OUTPUT_DIR/480p.m3u8"

# Check if ffmpeg succeeded
if [ $? -eq 0 ]; then
    # Create master playlist
    cat > "$OUTPUT_DIR/master.m3u8" << EOF
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5192000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2928000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1496000,RESOLUTION=854x480
480p.m3u8
EOF

    echo "✅ Transcoding complete!"
    echo "Master playlist: $OUTPUT_DIR/master.m3u8"
    exit 0
else
    echo "❌ Transcoding failed!"
    exit 1
fi
