# swipe2clean

A desktop file cleaner with a Tinder-style swipe interface. Review files one by one — swipe right to keep, swipe left to trash.

Built with [Tauri v2](https://v2.tauri.app), React, TypeScript, and Rust.

## Features

- **Tinder-style swiping** — drag cards, use arrow keys, or click buttons
- **Smart file previews** — images render as thumbnails, text/code shows the first 10 lines
- **Batch trash** — files accumulate in a buffer and are moved to the system trash in batches
- **Undo** — instantly restore the last trashed file (Cmd/Ctrl+Z or click the undo toast)
- **Large file warnings** — confirmation prompt for files over 500 MB
- **Safe by default** — files go to the OS trash (not permanently deleted), system paths are protected
- **Dark/light mode** — follows your system preference
- **State persistence** — remembers your last selected folder between sessions

## Keyboard Shortcuts

| Key | Action |
| --- | --- |
| `Arrow Right` | Keep file |
| `Arrow Left` | Trash file |
| `Space` | Open file in default viewer |
| `Cmd/Ctrl + Z` | Undo last trash |

## Prerequisites

- [Rust](https://rustup.rs/) (stable)
- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (package manager)
- Tauri v2 system dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

## Development

```bash
# Install frontend dependencies
bun install

# Start the dev server (launches the app)
bun run tauri dev
```

## Build

```bash
# Create a production build
bun run tauri build
```

The distributable will be in `src-tauri/target/release/bundle/`.

## Project Structure

```
swipe2clean/
├── src-tauri/           # Rust backend
│   └── src/
│       ├── lib.rs       # Tauri command registration
│       ├── scanner.rs   # Directory scanning + file classification
│       ├── preview.rs   # Image thumbnails + text previews
│       ├── trash_manager.rs  # Trash operations + restore
│       └── state.rs     # JSON state persistence
├── src/                 # React frontend
│   ├── views/           # SelectionView, SwipeView, SummaryView
│   ├── components/      # CardStack, FileCard, UndoToast, ConfirmModal
│   ├── hooks/           # useSwipe, useFileQueue
│   └── lib/             # Types, Tauri command wrappers, utilities
├── index.html
├── package.json
└── vite.config.ts
```

## License

MIT
