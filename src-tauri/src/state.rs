use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::Manager;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppState {
    pub last_folder: Option<String>,
    pub recursive: bool,
    /// Large-file warning threshold in megabytes. Defaults to 500 MB.
    #[serde(default = "default_large_file_threshold_mb")]
    pub large_file_threshold_mb: u32,
    /// Theme preference: "system", "light", or "dark". Defaults to "system".
    #[serde(default = "default_theme")]
    pub theme: String,
}

fn default_large_file_threshold_mb() -> u32 {
    500
}

fn default_theme() -> String {
    "system".to_string()
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            last_folder: None,
            recursive: false,
            large_file_threshold_mb: default_large_file_threshold_mb(),
            theme: default_theme(),
        }
    }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Load persisted state from disk, returning defaults if the file is missing.
pub fn load(app_handle: &tauri::AppHandle) -> Result<AppState, String> {
    let path = state_file_path(app_handle)?;

    if !path.exists() {
        return Ok(AppState::default());
    }

    let contents = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&contents).map_err(|e| e.to_string())
}

/// Persist state to disk.
pub fn save(app_handle: &tauri::AppHandle, state: &AppState) -> Result<(), String> {
    let path = state_file_path(app_handle)?;
    let contents = serde_json::to_string_pretty(state).map_err(|e| e.to_string())?;
    fs::write(&path, contents).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

fn state_file_path(app_handle: &tauri::AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data dir: {}", e))?;

    fs::create_dir_all(&app_dir).map_err(|e| e.to_string())?;

    Ok(app_dir.join("state.json"))
}
