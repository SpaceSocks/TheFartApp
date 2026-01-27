# The Fart App

The ultimate fart soundboard, timer, and alarm app. Joke concept, serious execution.

## Features

### Instant Fart
- Giant fart button with satisfying animations
- 6 built-in synthesized fart sounds (Classic, Squeaky, Thunder, Wet, Long, Rapid Fire)
- Record your own custom fart sounds
- Press **Spacebar** for instant fart (keyboard shortcut!)

### Timer
- Countdown timer from 5 seconds to 5 minutes
- When timer ends, a fart sound plays
- Respects volume and repeat settings

### Alarms
- Schedule fart alarms for any time
- Repeat options: Once, Daily, Weekdays, Weekends
- Choose which sound plays for each alarm
- Works even when app is minimized to system tray

### Settings
- **Volume control** - Adjust fart loudness
- **Randomize sounds** - Each fart is a surprise
- **Repeat mode** - Fart multiple times or infinitely
- **Random farts** - Get surprised with random farts throughout the day
- **Desktop notifications** - Get notified when alarms trigger

### System Tray
- App minimizes to system tray (doesn't close)
- Right-click tray icon for quick actions
- Alarms and random farts continue working in background

## Development

### Prerequisites
- Node.js 18+
- npm

### Running the App

```bash
# Install dependencies
npm install

# Run in development mode (web only)
npm run dev

# Run with Electron (full desktop app)
npm run electron:dev

# Build for production
npm run electron:build
```

### Tech Stack
- **Electron** - Desktop app framework
- **React** - UI framework
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Web Audio API** - Sound synthesis
- **IndexedDB** - Custom sound storage

## Keyboard Shortcuts
- **Space** - Instant fart (on Instant Fart tab)

## Building for iOS
This app is designed with mobile-first dimensions (375-428px width) for easy porting to iOS using React Native or Capacitor.

## License
MIT

---
Made with much love
