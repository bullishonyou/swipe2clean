use std::path::{Path, PathBuf};
use std::process::Command;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Move a batch of files to the system trash.
pub fn move_to_trash(paths: Vec<String>) -> Result<(), String> {
    for path in &paths {
        trash::delete(path).map_err(|e| format!("Failed to trash '{}': {}", path, e))?;
    }
    Ok(())
}

/// Restore a previously trashed file by its original path.
///
/// On macOS, files are restored from `~/.Trash/` by matching the file name.
/// On Linux/Windows, the `trash::os_limited` API is used for proper restore.
pub fn restore(original_path: &str) -> Result<(), String> {
    restore_platform(original_path)
}

/// Open a file in the default system viewer.
pub fn open_file(path: &str) -> Result<(), String> {
    let cmd = if cfg!(target_os = "macos") {
        "open"
    } else {
        "xdg-open"
    };

    Command::new(cmd)
        .arg(path)
        .spawn()
        .map_err(|e| format!("Failed to open file: {}", e))?;

    Ok(())
}

// ---------------------------------------------------------------------------
// Platform-specific restore
// ---------------------------------------------------------------------------

/// On macOS, `trash::os_limited` is not available. We restore by scanning
/// `~/.Trash/` for the file by name and moving it back to its original path.
#[cfg(target_os = "macos")]
fn restore_platform(original_path: &str) -> Result<(), String> {
    let file_name = Path::new(original_path)
        .file_name()
        .ok_or_else(|| "Invalid path: no file name".to_string())?
        .to_string_lossy()
        .to_string();

    let home = std::env::var("HOME").map_err(|e| format!("Cannot read $HOME: {}", e))?;
    let trash_path = PathBuf::from(&home).join(".Trash").join(&file_name);

    if !trash_path.exists() {
        return Err(format!("File not found in trash: {}", file_name));
    }

    std::fs::rename(&trash_path, original_path)
        .map_err(|e| format!("Failed to restore '{}': {}", file_name, e))
}

/// On Linux (freedesktop) and Windows, the `trash` crate exposes
/// `os_limited::list()` and `os_limited::restore_all()`.
#[cfg(not(target_os = "macos"))]
fn restore_platform(original_path: &str) -> Result<(), String> {
    let items = trash::os_limited::list()
        .map_err(|e| format!("Failed to list trash: {}", e))?;

    let matching: Vec<_> = items
        .into_iter()
        .filter(|item| {
            item.original_path().to_string_lossy() == original_path
        })
        .collect();

    if matching.is_empty() {
        return Err(format!("File not found in trash: {}", original_path));
    }

    trash::os_limited::restore_all(matching)
        .map_err(|e| format!("Failed to restore: {}", e))?;

    Ok(())
}
