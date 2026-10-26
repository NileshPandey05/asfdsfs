#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$DIR")"

echo "================================================================="
echo " Wind Forecast Intelligence — OBS Live CDP Automated Recording"
echo " Narration Voice: Natural American Tech (Guy Neural)"
echo " Duration: ~8 Minutes (Part 1 < 5m, Part 2 < 5m)"
echo " Target Site: https://asfdsfs-five.vercel.app/ via CDP port 9222"
echo "================================================================="

# 1. Start OBS Studio with auto-recording
echo "[1/4] Launching OBS Studio with automatic screen recording..."
flatpak run com.obsproject.Studio --startrecording &
OBS_PID=$!
echo "OBS launched (PID: $OBS_PID). Waiting 5 seconds for PipeWire capture stream..."
sleep 5

# 2. Start audio playback in background
echo "[2/4] Starting high-definition voiceover narration..."
if command -v pw-play >/dev/null 2>&1; then
  pw-play "$DIR/full_wind_forecast_intelligence_demo.mp3" &
  AUDIO_PID=$!
elif command -v ffplay >/dev/null 2>&1; then
  ffplay -nodisp -autoexit "$DIR/full_wind_forecast_intelligence_demo.mp3" >/dev/null 2>&1 &
  AUDIO_PID=$!
elif command -v mpv >/dev/null 2>&1; then
  mpv --no-video "$DIR/full_wind_forecast_intelligence_demo.mp3" >/dev/null 2>&1 &
  AUDIO_PID=$!
fi

# 3. Run automated CDP walkthrough
echo "[3/4] Driving Chrome browser over CDP port 9222..."
python3 "$DIR/cdp_walkthrough.py"

# Wait for audio to finish if still playing
if [ -n "$AUDIO_PID" ]; then
  wait $AUDIO_PID 2>/dev/null || true
fi

# 4. Stop OBS recording
echo "[4/4] Walkthrough complete! Finalizing OBS recording..."
kill -SIGINT $OBS_PID 2>/dev/null || true
sleep 3

echo "================================================================="
echo " Recording Complete!"
echo " Check your OBS output directory (e.g. ~/Documents/fatefour/ or ~/)"
echo " Video is ready for unlisted YouTube submission!"
echo "================================================================="
