use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::GenericImageView;
use serde::Serialize;
use std::fs::File;
use std::io::{BufRead, BufReader, Cursor};
use std::path::Path;

use crate::scanner::{classify_file, FileKind};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Serialize)]
pub struct PreviewData {
    pub kind: FileKind,
    pub content: Option<String>,
    pub extension: String,
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_THUMBNAIL_SIZE: u32 = 400;
const MAX_TEXT_LINES: usize = 10;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Generate a preview for the file at `path`.
///
/// - **Images** are resized to a thumbnail and returned as base64-encoded PNG.
/// - **Text/code** files return the first 10 lines.
/// - **Video/binary** files return `None` for content.
pub fn generate_preview(path: &str) -> Result<PreviewData, String> {
    let file_path = Path::new(path);
    let extension = file_path
        .extension()
        .map(|e| e.to_string_lossy().to_lowercase())
        .unwrap_or_default();

    let kind = classify_file(&extension);

    let content = match kind {
        FileKind::Image => generate_image_thumbnail(path).ok(),
        FileKind::Text => read_text_preview(path).ok(),
        FileKind::Video | FileKind::Binary => None,
    };

    Ok(PreviewData {
        kind,
        content,
        extension,
    })
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

fn generate_image_thumbnail(path: &str) -> Result<String, String> {
    let img = image::open(path).map_err(|e| e.to_string())?;

    let (width, height) = img.dimensions();
    let thumbnail = if width > MAX_THUMBNAIL_SIZE || height > MAX_THUMBNAIL_SIZE {
        img.thumbnail(MAX_THUMBNAIL_SIZE, MAX_THUMBNAIL_SIZE)
    } else {
        img
    };

    let mut buffer: Vec<u8> = Vec::new();
    thumbnail
        .write_to(&mut Cursor::new(&mut buffer), image::ImageFormat::Png)
        .map_err(|e| e.to_string())?;

    Ok(BASE64.encode(&buffer))
}

fn read_text_preview(path: &str) -> Result<String, String> {
    let file = File::open(path).map_err(|e| e.to_string())?;
    let reader = BufReader::new(file);

    let lines: Vec<String> = reader
        .lines()
        .take(MAX_TEXT_LINES)
        .collect::<Result<Vec<_>, _>>()
        .map_err(|e| e.to_string())?;

    Ok(lines.join("\n"))
}
