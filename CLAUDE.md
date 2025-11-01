# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 video player application with HLS streaming support. The application is designed to support future synchronization features for watching videos together across multiple users.

## Development Commands

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Prepare Nuxt (runs automatically after install)
npm run postinstall
```

## Architecture

### Video Player System

The video player is built with two main components:

**VideoPlayer.vue** - Main video player component
- Uses HLS.js for adaptive bitrate streaming
- Supports both HLS playlists (with `hls:` prefix) and regular video files
- Exposes a single method: `load(url: string)` - this is the ONLY way to load videos
- Auto-detects available quality levels from HLS manifests
- Manages audio/video track selection for playlists
- Uses localStorage for persistent settings (volume, mute state)

**VideoPlayerProgress.vue** - Custom progress bar component
- Implements two-way binding with `defineModel` for current time and dragging state
- Uses `useThrottleFn` from VueUse to throttle updates during scrubbing
- Supports both mouse and touch events for desktop/mobile

### Video Loading Pattern

Videos are loaded using a prefix-based system:
- `hls:https://...` - Loads as HLS playlist with quality selection and track management
- `https://...` (no prefix) - Loads as regular video file

This explicit prefix approach was chosen over auto-detection (checking for .m3u8 extensions) for reliability and explicit intent.

### HLS.js Integration

The player listens to these HLS.js events:
- `LEVEL_SWITCHING` / `LEVEL_SWITCHED` - Quality change animation
- `MANIFEST_PARSED` - Extract available qualities and determine if playlist
- `AUDIO_TRACKS_UPDATED` / `AUDIO_TRACK_SWITCHED` - Audio track management

Quality levels are extracted from HLS manifests and formatted as "1080p", "720p", etc. based on the `height` property.

### State Management

Player state uses Vue 3 Composition API with refs:
- `loading` - Controls loading animation (set on load(), cleared on 'loadeddata' event)
- `isPlaylist` - Determines if quality/track selectors should be shown
- `availableLevels` - Array of quality levels extracted from HLS manifest
- `audioTracks` / `videoTracks` - Available tracks (only populated for playlists)
- `volume` / `muted` - Persist to localStorage via `useLocalStorage` from VueUse

### UI Framework

Uses Nuxt UI (@nuxt/ui) for components:
- `UButton` - All buttons (play, pause, fullscreen, quality, etc.)
- `UDropdownMenu` - Quality and track selection menus
- `UPopover` - Volume control
- `UIcon` - Icons throughout (Heroicons and MDI)
- `USlider` - Volume slider

### Future Architecture Notes

This project is being built to support Socket.io synchronization:
- A separate `sync-server` project will handle WebSocket rooms
- The VideoPlayer component will need to emit events (play, pause, seek, quality change) to sync server
- Incoming sync events will need to call VideoPlayer methods without triggering outgoing events (to avoid loops)

## Key Design Decisions

1. **No props for URL** - Video loading happens exclusively through the `load()` method exposed via `defineExpose`
2. **Explicit HLS prefix** - Using `hls:` prefix is more reliable than file extension detection
3. **Quality parsing from manifest** - Qualities are extracted from HLS.js parsed data, not from URL patterns
4. **LocalStorage for settings** - Volume and mute state persist across sessions
5. **Custom progress bar** - Built from scratch for full control over drag behavior and sync requirements

## Component Props

### VideoPlayer
- No props - everything is controlled via the exposed `load(url)` method

### VideoPlayerProgress
- Props: `duration: number`
- Models: `v-model` (currentTime), `v-model:isDragging` (boolean)

## Common Patterns

When adding new player controls or features:
1. Add state as a ref in VideoPlayer.vue
2. If it needs persistence, use `useLocalStorage` from VueUse
3. Add UI in the controls section (within the bottom gradient overlay)
4. For dropdowns, follow the pattern of quality/audio/video track selectors
5. Remember to check `isPlaylist` if the feature only applies to HLS content
