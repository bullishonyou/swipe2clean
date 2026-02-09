mod preview;
mod scanner;
mod state;
mod trash_manager;

use state::AppState;

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
fn scan_directory(path: String, recursive: bool) -> Result<Vec<scanner::FileEntry>, String> {
    scanner::scan(&path, recursive)
}

#[tauri::command]
fn get_file_preview(path: String) -> Result<preview::PreviewData, String> {
    preview::generate_preview(&path)
}

#[tauri::command]
fn trash_files(paths: Vec<String>) -> Result<(), String> {
    trash_manager::move_to_trash(paths)
}

#[tauri::command]
fn restore_from_trash(original_path: String) -> Result<(), String> {
    trash_manager::restore(&original_path)
}

#[tauri::command]
fn open_in_viewer(path: String) -> Result<(), String> {
    trash_manager::open_file(&path)
}

#[tauri::command]
fn load_state(app_handle: tauri::AppHandle) -> Result<AppState, String> {
    state::load(&app_handle)
}

#[tauri::command]
fn save_state(app_handle: tauri::AppHandle, state: AppState) -> Result<(), String> {
    state::save(&app_handle, &state)
}

// ---------------------------------------------------------------------------
// App entry point
// ---------------------------------------------------------------------------

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            scan_directory,
            get_file_preview,
            trash_files,
            restore_from_trash,
            open_in_viewer,
            load_state,
            save_state,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
