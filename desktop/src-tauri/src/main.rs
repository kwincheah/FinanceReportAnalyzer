#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .setup(|_app| {
            // Optional: Launch backend python sidecar process locally on startup
            println!("Bursa Malaysia Forensic Intelligence Terminal initialized.");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running Bursa Terminal application");
}
