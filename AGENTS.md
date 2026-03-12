# AGENTS.md

## Cursor Cloud specific instructions

**swipe2clean** is a Tauri v2 desktop app (React + TypeScript frontend, Rust backend). No external services, databases, or Docker needed.

### Prerequisites (system-level, already installed in snapshot)

- Rust stable (>= 1.85 required; `dlopen2_derive` needs edition 2024)
- Bun (`~/.bun/bin/bun`) — used as package manager and script runner
- Tauri v2 Linux system deps: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, `libappindicator3-dev`, `librsvg2-dev`, `libssl-dev`, `patchelf`

### Key commands

| Task | Command |
|------|---------|
| Install JS deps | `bun install` |
| Dev mode (launches app) | `DISPLAY=:1 bun run tauri dev` |
| TypeScript check (src only) | `npx tsc --noEmit` |
| Rust check | `cd src-tauri && cargo check` |
| Production build | `bun run tauri build` |

### Gotchas

- `bun run build` (which runs `tsc -b && vite build`) fails because `vite.config.ts` references `process.env` without `@types/node`. This is a pre-existing issue. Use `npx tsc --noEmit` to check only the `src/` application code.
- The default Rust toolchain in the base VM image is pinned to 1.83.0; the update script sets `stable` as default. If Rust compilation fails with "feature `edition2024` is required", run `rustup default stable`.
- The app requires a display server (`DISPLAY=:1` is set via Xvfb in the cloud VM).
- First `cargo check` / `bun run tauri dev` takes ~45-60s to compile all Rust dependencies; subsequent runs use cached artifacts.
- There are no automated tests in this repository (no test scripts in `package.json`, no `#[test]` modules in Rust code).
