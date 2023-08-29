#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![full_page_screenshot, capture_area])
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
