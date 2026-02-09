use serde::Serialize;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;
use walkdir::WalkDir;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum FileKind {
    Image,
    Video,
    Text,
    Binary,
}

#[derive(Debug, Clone, Serialize)]
pub struct FileEntry {
    pub path: String,
    pub name: String,
    pub extension: String,
    pub size: u64,
    pub modified: i64,
    pub accessed: i64,
    pub file_type: FileKind,
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HIDDEN_FILES: &[&str] = &[".DS_Store", "Thumbs.db", "desktop.ini"];

const PROTECTED_PATHS: &[&str] = &["/System", "/bin", "/usr", "/sbin", "/etc"];

const IMAGE_EXTENSIONS: &[&str] = &[
    "png", "jpg", "jpeg", "gif", "bmp", "webp", "svg", "ico", "tiff", "tif",
];

const VIDEO_EXTENSIONS: &[&str] = &[
    "mp4", "mov", "avi", "mkv", "wmv", "flv", "webm", "m4v",
];

const TEXT_EXTENSIONS: &[&str] = &[
    "txt", "md", "csv", "json", "xml", "html", "css", "js", "ts", "jsx", "tsx",
    "py", "rs", "go", "java", "c", "cpp", "h", "hpp", "sh", "bash", "zsh",
    "yaml", "yml", "toml", "ini", "cfg", "conf", "log", "sql", "rb", "php",
    "swift", "kt", "scala", "r", "lua", "pl", "ex", "exs", "hs", "elm",
    "vue", "svelte", "astro",
];

// ---------------------------------------------------------------------------
// Public helpers
// ---------------------------------------------------------------------------

/// Classify a file extension into a `FileKind`.
pub fn classify_file(ext: &str) -> FileKind {
    let lower = ext.to_lowercase();
    if IMAGE_EXTENSIONS.contains(&lower.as_str()) {
        FileKind::Image
    } else if VIDEO_EXTENSIONS.contains(&lower.as_str()) {
        FileKind::Video
    } else if TEXT_EXTENSIONS.contains(&lower.as_str()) {
        FileKind::Text
    } else {
        FileKind::Binary
    }
}

// ---------------------------------------------------------------------------
// Core scan logic
// ---------------------------------------------------------------------------

/// Scan a directory for files, optionally recursing into subdirectories.
/// Results are sorted by modified date ascending (oldest first).
pub fn scan(path: &str, recursive: bool) -> Result<Vec<FileEntry>, String> {
    let root = Path::new(path);

    if !root.exists() {
        return Err(format!("Path does not exist: {}", path));
    }
    if !root.is_dir() {
        return Err(format!("Path is not a directory: {}", path));
    }
    if is_protected(path) {
        return Err(format!("Cannot scan protected system path: {}", path));
    }

    let mut entries: Vec<FileEntry> = Vec::new();

    if recursive {
        for entry in WalkDir::new(root)
            .min_depth(1)
            .into_iter()
            .filter_entry(|e| {
                let name = e.file_name().to_string_lossy();
                !is_hidden(&name)
            })
        {
            let entry = entry.map_err(|e| e.to_string())?;
            if entry.file_type().is_file() {
                if let Some(fe) = process_entry(entry.path()) {
                    entries.push(fe);
                }
            }
        }
    } else {
        let dir = fs::read_dir(root).map_err(|e| e.to_string())?;
        for entry in dir {
            let entry = entry.map_err(|e| e.to_string())?;
            let name = entry.file_name().to_string_lossy().to_string();
            if is_hidden(&name) {
                continue;
            }
            let path = entry.path();
            if path.is_file() {
                if let Some(fe) = process_entry(&path) {
                    entries.push(fe);
                }
            }
        }
    }

    // Sort oldest first
    entries.sort_by_key(|e| e.modified);

    Ok(entries)
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

fn is_hidden(name: &str) -> bool {
    name.starts_with('.') || HIDDEN_FILES.contains(&name)
}

fn is_protected(path: &str) -> bool {
    PROTECTED_PATHS.iter().any(|p| path.starts_with(p))
}

fn process_entry(path: &Path) -> Option<FileEntry> {
    let metadata = fs::metadata(path).ok()?;
    let name = path.file_name()?.to_string_lossy().to_string();
    let extension = path
        .extension()
        .map(|e| e.to_string_lossy().to_string())
        .unwrap_or_default();

    let modified = metadata
        .modified()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    let accessed = metadata
        .accessed()
        .ok()
        .and_then(|t| t.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_secs() as i64)
        .unwrap_or(0);

    Some(FileEntry {
        path: path.to_string_lossy().to_string(),
        name,
        file_type: classify_file(&extension),
        extension,
        size: metadata.len(),
        modified,
        accessed,
    })
}
