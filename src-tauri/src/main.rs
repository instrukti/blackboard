#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            is_dir_js,
            full_page_screenshot,
            capture_area
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
#[tauri::command]
fn full_page_screenshot() -> Vec<String> {
    let mut string_vector: Vec<String> = Vec::new();
    use base64::{engine::general_purpose, Engine as _};
    use screenshots::{Compression, Screen};

    let screens = Screen::all().unwrap();
    for screen in screens {
        let image = screen.capture().unwrap();
        let buffer = image.to_png(Compression::Best).unwrap();
        string_vector.push(general_purpose::STANDARD.encode(&buffer));
    }
    return string_vector;
}
#[tauri::command]
fn capture_area(x: i32, y: i32, width: u32, height: u32) -> Vec<String> {
    let mut string_vector: Vec<String> = Vec::new();
    use base64::{engine::general_purpose, Engine as _};
    use screenshots::{Compression, Screen};

    let screens = Screen::all().unwrap();
    for screen in screens {
        let image = screen.capture_area(x, y, width, height).unwrap();
        let buffer = image.to_png(Compression::Best).unwrap();
        string_vector.push(general_purpose::STANDARD.encode(&buffer));
    }
    return string_vector;
}
#[tauri::command]
fn is_dir_js(filename: &str) -> Result<String, String> {
    use std::fs;
    use std::time::UNIX_EPOCH;
    let metadata = fs::metadata(filename).expect("Failed to stat file");
    let time = metadata.modified().expect("Failed to get mtime");
    let millis = time
        .duration_since(UNIX_EPOCH)
        .expect("Failed to calculate mtime")
        .as_millis();

    let u64millis = u64::try_from(millis).expect("Integer to large");

    let is_dir = if metadata.is_dir() { "true" } else { "false" };
    let size = metadata.len();
    let extension = get_file_extension(filename);

    return Ok(format!(
        "{{\"mtime\":{},\"extension\":\"{}\",\"isDir\":{},\"size\":{}}}",
        u64millis, extension, is_dir, size
    ));
}

fn get_file_extension(filename: &str) -> &str {
    if let Some(dot_position) = filename.rfind('.') {
        // Add 1 to skip the dot
        &filename[dot_position + 1..]
    } else {
        ""
    }
}
