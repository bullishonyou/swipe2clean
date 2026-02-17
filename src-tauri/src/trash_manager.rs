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
