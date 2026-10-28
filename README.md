# Varanasi Movie Countdown Clone

An exact replica of the [Varanasi Countdown](https://varanasi-countdown.vercel.app/) website.

## Features Included

- **Live Countdown Timer**: Counts down to April 7, 2027 (`2027-04-07T00:00:00+05:30` IST) with smooth digit transitions.
- **Sound & Video Background**:
  - High-definition native video sequence (`assets/hero-loop.mp4`) that plays through once and smoothly cross-fades to the background photo (`image 1.jpg`).
  - Synchronized AAC soundtrack (`assets/hero-audio.m4a`) that begins playing once upon the user scrolling the page (with glowing **"🔊 Scroll to play sound"** hint).
  - Both audio and video play through their sequence once without looping.
- **Cinema Scopes & Formats Section** (Above Cast & Crew):
  - Interactive aspect ratio viewer comparing **1.43:1 (IMAX)**, **1.90:1 (IMAX Digital)**, **2.20:1 (70mm)**, **1.85:1 (Flat)**, and **2.39:1 (Scope)**.
  - Smooth dynamic viewport reshaping and live framing demonstration.
  - **Resolution Settings Menu (⚙)**: Switch video quality up to **4K (2160p UHD)**, **1080p HD**, **720p**, **480p**, and **Auto** with live resolution badge.
  - Mutual playback coordination: Playing the Experience video automatically silences the hero background audio/video, and scrolling back to the top resumes the hero video.
  - Full player controls (Play/Pause, scrub seek bar, elapsed/duration time, volume, fullscreen).
  - High-res full 3:32 video with dual-fallback support (Cloudflare HLS + local faststart MP4).
- **Story & Cast Sections**: Complete with hover animations, parallax effects, and intersection observers for scroll animations.
- **Story Cards**: Background images `image 3.jpg` and `image 4.jpg`.
- **Interactive Modals & Actions**:
  - **WATCH TEASER / WATCH** button: Opens the full trailer modal with embedded video and keyboard shortcut support (Escape / Space / Enter).
  - **ADD REMINDER** button: Automatically creates a Google Calendar event for the worldwide release on April 7, 2027.
- **Visual Effects**:
  - Particle intro loading screen with progress bar.
  - Gold cursor glow effect on desktop.
  - Top scroll progress bar and smooth "Back to Top" button.
- **Additional Pages**:
  - `privacy-policy.html`: Complete fan site privacy policy.

## How to Run Locally

You can open `index.html` directly in any web browser, or start the included video streaming server:

```powershell
# Recommended (includes HTTP Range 206 support for instant 4K scrubbing)
python serve.py 8000

# Or standard Python HTTP server
python -m http.server 8000
```
Then open `http://localhost:8000/` in your browser.
