#!/bin/bash

# Audio Optimization Conversion Script
# Converts large WAV files (600+ MB) to optimized 3-minute AAC loops (2-5 MB)
#
# Prerequisites:
# - ffmpeg installed and in PATH
# - Run from the directory containing the original WAV files
# - Output directory: ../assets/audio/

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo -e "${RED}Error: ffmpeg is not installed. Please install ffmpeg first.${NC}"
    exit 1
fi

# Set up directories
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/assets/audio"
BINAURAL_DIR="$OUTPUT_DIR/binaural"
SOLFEGGIO_DIR="$OUTPUT_DIR/solfeggio"

# Create output directories
mkdir -p "$BINAURAL_DIR"
mkdir -p "$SOLFEGGIO_DIR"

echo -e "${GREEN}Audio Optimization Conversion Script${NC}"
echo -e "${GREEN}=====================================${NC}"
echo ""
echo "Output directory: $OUTPUT_DIR"
echo ""

# Function to convert a single file
convert_file() {
    local input_file="$1"
    local output_file="$2"
    local category="$3"
    
    if [ ! -f "$input_file" ]; then
        echo -e "${YELLOW}Warning: Input file not found: $input_file${NC}"
        return 1
    fi
    
    echo -e "${GREEN}Converting: $input_file${NC}"
    echo -e "  → $output_file"
    
    ffmpeg -y \
        -i "$input_file" \
        -ac 2 \
        -ar 44100 \
        -c:a aac \
        -b:a 128k \
        -t 180 \
        "$output_file" \
        2>&1 | grep -E "(Duration|Stream|Output|error)" || true
    
    if [ $? -eq 0 ]; then
        # Get file size
        if [ -f "$output_file" ]; then
            FILE_SIZE=$(du -h "$output_file" | cut -f1)
            echo -e "${GREEN}  ✓ Created: $output_file (${FILE_SIZE})${NC}"
        else
            echo -e "${RED}  ✗ Failed to create: $output_file${NC}"
            return 1
        fi
    else
        echo -e "${RED}  ✗ Conversion failed: $input_file${NC}"
        return 1
    fi
    echo ""
}

# Get the directory containing raw audio files
RAW_AUDIO_DIR="$PROJECT_ROOT/raw audio files"

if [ ! -d "$RAW_AUDIO_DIR" ]; then
    echo -e "${YELLOW}Warning: Raw audio files directory not found: $RAW_AUDIO_DIR${NC}"
    echo "Please update RAW_AUDIO_DIR in the script or run from the correct directory."
    echo ""
    echo "You can also specify the input directory as an argument:"
    echo "  ./scripts/convert-audio.sh /path/to/raw/audio/files"
    echo ""
    
    if [ -n "$1" ]; then
        RAW_AUDIO_DIR="$1"
        echo "Using provided directory: $RAW_AUDIO_DIR"
    else
        echo -e "${RED}Error: No input directory specified.${NC}"
        exit 1
    fi
fi

BINAURAL_SOURCE_DIR="$RAW_AUDIO_DIR/ZENmix - Pure Binaural Beats"
SOLFEGGIO_SOURCE_DIR="$RAW_AUDIO_DIR/ZENmix - Pure Solfeggio"

echo "Source directories:"
echo "  Binaural: $BINAURAL_SOURCE_DIR"
echo "  Solfeggio: $SOLFEGGIO_SOURCE_DIR"
echo ""

# Convert Binaural Beats
if [ -d "$BINAURAL_SOURCE_DIR" ]; then
    echo -e "${GREEN}Converting Binaural Beats...${NC}"
    echo ""
    
    # Alpha
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Alpha@10Hz - 400Hz Base.wav" \
        "$BINAURAL_DIR/alpha_10hz_400_3min.m4a" "alpha"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Alpha@12Hz - 120Hz Base.wav" \
        "$BINAURAL_DIR/alpha_12hz_120_3min.m4a" "alpha"
    
    # Beta
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Beta@13Hz - 400Hz Base.wav" \
        "$BINAURAL_DIR/beta_13hz_400_3min.m4a" "beta"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Beta@20Hz - 120Hz Base.wav" \
        "$BINAURAL_DIR/beta_20hz_120_3min.m4a" "beta"
    
    # Delta
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Delta@1Hz - 100Hz Base.wav" \
        "$BINAURAL_DIR/delta_1hz_100_3min.m4a" "delta"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Delta@2Hz - 120Hz Base.wav" \
        "$BINAURAL_DIR/delta_2hz_120_3min.m4a" "delta"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Delta@4Hz - 400Hz Base.wav" \
        "$BINAURAL_DIR/delta_4hz_400_3min.m4a" "delta"
    
    # Gamma
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Gamma@38Hz - 100Hz Base.wav" \
        "$BINAURAL_DIR/gamma_38hz_100_3min.m4a" "gamma"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Gamma@40Hz - 120Hz Base.wav" \
        "$BINAURAL_DIR/gamma_40hz_120_3min.m4a" "gamma"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Gamma@42Hz - 400Hz Base.wav" \
        "$BINAURAL_DIR/gamma_42hz_400_3min.m4a" "gamma"
    
    # Theta
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Theta@4Hz - 400Hz Base.wav" \
        "$BINAURAL_DIR/theta_4hz_400_3min.m4a" "theta"
    
    convert_file "$BINAURAL_SOURCE_DIR/Binaural Beat - Theta@8Hz - 120Hz Base.wav" \
        "$BINAURAL_DIR/theta_8hz_120_3min.m4a" "theta"
else
    echo -e "${YELLOW}Warning: Binaural beats directory not found: $BINAURAL_SOURCE_DIR${NC}"
fi

echo ""

# Convert Solfeggio Tones
if [ -d "$SOLFEGGIO_SOURCE_DIR" ]; then
    echo -e "${GREEN}Converting Solfeggio Tones...${NC}"
    echo ""
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 174hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_174_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 285hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_285_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 396hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_396_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 40hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_40_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 417hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_417_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 432hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_432_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 528hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_528_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 639hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_639_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 741hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_741_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 852hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_852_3min.m4a" "solfeggio"
    
    convert_file "$SOLFEGGIO_SOURCE_DIR/Solfeggio 963hz.wav" \
        "$SOLFEGGIO_DIR/solfeggio_963_3min.m4a" "solfeggio"
else
    echo -e "${YELLOW}Warning: Solfeggio directory not found: $SOLFEGGIO_SOURCE_DIR${NC}"
fi

echo ""
echo -e "${GREEN}=====================================${NC}"
echo -e "${GREEN}Conversion Complete!${NC}"
echo ""
echo "Optimized files are in: $OUTPUT_DIR"
echo ""
echo "Next steps:"
echo "1. Verify all files were created successfully"
echo "2. Update src/utils/audioFiles.ts to use the new file names"
echo "3. Test audio playback in the app"
echo "4. Remove references to old 600MB+ WAV files"
echo ""

