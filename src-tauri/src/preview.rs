use base64::engine::general_purpose::STANDARD as BASE64;
use base64::Engine;
use image::ImageReader;
use serde::Serialize;
use std::fs::{self, File};
use std::io::{BufRead, BufReader, Cursor};
use std::path::Path;
use std::process::Command;

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
/// Reject images with more than 25 million pixels (~100 MB uncompressed).
const MAX_DECODE_PIXELS: u64 = 25_000_000;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/// Generate a preview for the file at `path`.
///
/// - **Images** are resized to a thumbnail and returned as base64-encoded JPEG.
///   Images that exceed the pixel budget are skipped (returns `None`).
/// - **Documents (PDF)** are thumbnailed via OS-native tools (qlmanage / pdftoppm)
///   and returned as base64-encoded PNG.
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
        FileKind::Image => generate_image_thumbnail(path)
            .ok()
            .flatten(),
        FileKind::Document => generate_pdf_thumbnail(path)
            .ok()
            .flatten(),
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

fn generate_image_thumbnail(path: &str) -> Result<Option<String>, String> {
    // 1. Read dimensions from the image header only (no full decode).
    let reader = ImageReader::open(path).map_err(|e| e.to_string())?;
    let (w, h) = reader.into_dimensions().map_err(|e| e.to_string())?;

    // 2. Reject images that would consume too much memory when decoded.
    if (w as u64) * (h as u64) > MAX_DECODE_PIXELS {
        return Ok(None);
    }

    // 3. Decode inside a block so the full-resolution image is dropped
    //    immediately after the thumbnail is created.
    let thumbnail = {
        let img = image::open(path).map_err(|e| e.to_string())?;
        if w > MAX_THUMBNAIL_SIZE || h > MAX_THUMBNAIL_SIZE {
            img.thumbnail(MAX_THUMBNAIL_SIZE, MAX_THUMBNAIL_SIZE)
        } else {
            img
        }
    };

    // 4. Encode as JPEG (~90% smaller than PNG for photo thumbnails).
    let mut buffer: Vec<u8> = Vec::new();
    thumbnail
        .write_to(&mut Cursor::new(&mut buffer), image::ImageFormat::Jpeg)
        .map_err(|e| e.to_string())?;

    Ok(Some(BASE64.encode(&buffer)))
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

/// Generate a thumbnail for a PDF using OS-native tools.
///
/// - **macOS**: `qlmanage -t -s <size> -o <tmpdir> <file>`
/// - **Linux**: `pdftoppm -png -singlefile -scale-to <size> <file> <out>`
///
/// Returns `Ok(None)` if the tool is unavailable or fails (graceful fallback).
fn generate_pdf_thumbnail(path: &str) -> Result<Option<String>, String> {
    let tmp_dir = std::env::temp_dir().join("swipe2clean_pdf");
    fs::create_dir_all(&tmp_dir).map_err(|e| e.to_string())?;

    let result = generate_pdf_thumbnail_platform(path, &tmp_dir);

    // Best-effort cleanup of the temp directory
    let _ = fs::remove_dir_all(&tmp_dir);

    result
}

#[cfg(target_os = "macos")]
fn generate_pdf_thumbnail_platform(
    path: &str,
    tmp_dir: &std::path::Path,
) -> Result<Option<String>, String> {
    let size = MAX_THUMBNAIL_SIZE.to_string();
    let output = Command::new("qlmanage")
        .args(["-t", "-s", &size, "-o"])
        .arg(tmp_dir)
        .arg(path)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok(None);
    }

    // qlmanage writes <filename>.png into the output directory
    let file_name = Path::new(path)
        .file_name()
        .unwrap_or_default()
        .to_string_lossy();
    let thumb_path = tmp_dir.join(format!("{}.png", file_name));

    if !thumb_path.exists() {
        return Ok(None);
    }

    let bytes = fs::read(&thumb_path).map_err(|e| e.to_string())?;
    Ok(Some(BASE64.encode(&bytes)))
}

#[cfg(not(target_os = "macos"))]
fn generate_pdf_thumbnail_platform(
    path: &str,
    tmp_dir: &std::path::Path,
) -> Result<Option<String>, String> {
    let size = MAX_THUMBNAIL_SIZE.to_string();
    let out_prefix = tmp_dir.join("thumb");
    let output = Command::new("pdftoppm")
        .args([
            "-png",
            "-singlefile",
            "-scale-to",
            &size,
            path,
        ])
        .arg(&out_prefix)
        .output()
        .map_err(|e| e.to_string())?;

    if !output.status.success() {
        return Ok(None);
    }

    // pdftoppm writes <prefix>.png
    let thumb_path = tmp_dir.join("thumb.png");

    if !thumb_path.exists() {
        return Ok(None);
    }

    let bytes = fs::read(&thumb_path).map_err(|e| e.to_string())?;
    Ok(Some(BASE64.encode(&bytes)))
}
