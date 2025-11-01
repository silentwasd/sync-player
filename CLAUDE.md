# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Nuxt 3 video player application with HLS streaming support and room-based architecture. The application allows users to create rooms where they can watch videos together with synchronization features across multiple users.

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

## Key Dependencies

- **Nuxt 3** - Vue.js framework with SSR support
- **@nuxt/ui** - UI component library with Tailwind CSS
- **hls.js** - HLS video streaming support
- **socket.io-client** - WebSocket client for real-time synchronization
- **uuid** - UUID generation for room IDs
- **@vueuse/core** - Vue composition utilities (useLocalStorage, useThrottleFn, etc.)

## Architecture

### Video Player System

The video player is built with two main components:

**VideoPlayer.vue** - Main video player component
- Uses HLS.js for adaptive bitrate streaming
- Supports both HLS playlists (with `hls:` prefix) and regular video files
- Exposes methods via `defineExpose`: `load(url)`, `setPosition(time)`, `play()`, `pause()`
- Auto-detects available quality levels from HLS manifests
- Manages audio/video track selection for playlists
- Uses localStorage for persistent settings (volume, mute state)
- Has auto-hide controls (via `resetTimeout()`) that hide after 1 second of inactivity
- Loading animations appear during initial load and buffering (using `waiting`/`playing` events)

**VideoPlayer Events & Models**
- **Events**: `setPosition` (when user changes position), `play`, `pause`
- **Models**: `v-model:position` (read-only, reflects current time), `v-model:playing` (read-only, reflects play state)
- Events are emitted when user actively changes state (scrubbing, clicking play/pause, keyboard shortcuts)
- Models update automatically during playback but do NOT trigger events (prevents sync loops)

**VideoPlayerProgress.vue** - Custom progress bar component
- Implements two-way binding with `defineModel` for current time and dragging state
- Uses `useThrottleFn` from VueUse to throttle updates during scrubbing (100ms)
- Supports both mouse and touch events for desktop/mobile
- Local progress state prevents jitter during drag operations

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

### Room System

The application uses a room-based architecture for multi-user synchronization:

**pages/index.vue** - Landing page
- Provides a button to create a new room
- Uses `uuid` package to generate unique room IDs (UUID v4)
- Navigates to `/rooms/[room-id]` when creating a room

**pages/rooms/[room].vue** - Room page
- Contains the VideoPlayer component
- Provides a URL input form for loading videos
- Accepts the room ID as a route parameter
- Calls `videoPlayerRef.value.load(url)` to load videos

### Socket.io Integration

The application includes `socket.io-client` for real-time synchronization (connects to `http://localhost:4000`):

**Event Flow Pattern** (prevents sync loops):
- **Outgoing**: VideoPlayer emits events → Room page watches models → Emits to socket
  - `@setPosition` → `socket.emit('set-position', time)`
  - `@play` → `socket.emit('user-playing')`
  - `@pause` → `socket.emit('user-paused')`
- **Incoming**: Socket receives events → Calls VideoPlayer methods directly
  - `position-updated` → `videoPlayerRef.value.setPosition(time)` (does NOT emit event back)
  - `new-video` → `videoPlayerRef.value.load(url)`

**Room System**:
- Room page joins socket room on mount with `userId` (from `useUserId` composable) and `roomId` (from route params)
- Users list is maintained in room state showing who's in the room and their play/pause status
- Video URL is synchronized across all users in the room

### UI Framework

Uses Nuxt UI (@nuxt/ui) for components:
- `UButton` - All buttons (play, pause, fullscreen, quality, etc.)
- `UDropdownMenu` - Quality and track selection menus
- `UPopover` - Volume control
- `UIcon` - Icons throughout (Heroicons and MDI)
- `USlider` - Volume slider
- `UContainer` - Page layout container
- `UForm` / `UFormField` / `UInput` - Form controls for URL input

## Key Design Decisions

1. **No props for URL** - Video loading happens exclusively through the `load()` method exposed via `defineExpose`
2. **Explicit HLS prefix** - Using `hls:` prefix is more reliable than file extension detection
3. **Quality parsing from manifest** - Qualities are extracted from HLS.js parsed data, not from URL patterns
4. **LocalStorage for settings** - Volume and mute state persist across sessions
5. **Custom progress bar** - Built from scratch for full control over drag behavior and sync requirements
6. **UUID-based rooms and users** - Each room gets a unique UUID v4 identifier; users get persistent UUIDs stored in cookies
7. **Client-side room creation** - No server-side validation needed for room creation, rooms are ephemeral
8. **Event/Model separation for sync** - Events signal user actions (emit to socket), models reflect state (read-only for parent), methods apply external changes (no event emission)

## Component API

### VideoPlayer
- **Props**: None
- **Models**:
  - `v-model:position` (number, read-only) - Current playback time in seconds
  - `v-model:playing` (boolean, read-only) - Current play/pause state
- **Events**:
  - `@setPosition(time: number)` - User changed position via scrubbing or keyboard
  - `@play()` - User pressed play
  - `@pause()` - User pressed pause
- **Exposed Methods**:
  - `load(url: string)` - Load video (use `hls:` prefix for HLS streams)
  - `setPosition(time: number)` - Set position programmatically (for sync, does NOT emit event)
  - `play()` - Start playback programmatically (for sync, does NOT emit event)
  - `pause()` - Pause playback programmatically (for sync, does NOT emit event)

### VideoPlayerProgress
- **Props**: `duration: number`
- **Models**:
  - `v-model` (number) - Current time in seconds
  - `v-model:isDragging` (boolean) - Whether user is dragging the progress bar

## Common Patterns

### Adding Player Controls
1. Add state as a ref in VideoPlayer.vue
2. If it needs persistence, use `useLocalStorage` from VueUse
3. Add UI in the controls section (within the bottom gradient overlay at bottom of template)
4. For dropdowns, follow the pattern of quality/audio/video track selectors (use `UDropdownMenu`)
5. Remember to check `isPlaylist` if the feature only applies to HLS content

### Implementing Synchronization Features
When adding new sync features, follow the event/model/method pattern:
1. **User Actions** → Emit event → Parent listens and sends to socket
   - Add event to `defineEmits` in VideoPlayer
   - Emit when user performs action (button click, keyboard shortcut, etc.)
   - Listen with `@eventName` in room page, emit to socket
2. **External Changes** → Call exposed method → No event emitted
   - Add method to `defineExpose` that directly updates video element
   - Listen to socket event in room page, call `videoPlayerRef.value.method()`
   - Method must NOT emit event back (prevents infinite loops)
3. **State Reflection** → Update model in event listener
   - Use `defineModel` for read-only state tracking
   - Update in appropriate video event listener (e.g., `timeupdate`, `play`, `pause`)
   - Parent can read via `v-model:name` but should not write to it

### Composables
- `useUserId()` - Returns a ref to persistent user UUID stored in cookie (1 year expiry)
- Auto-imported by Nuxt from `composables/` directory
