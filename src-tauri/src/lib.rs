mod commands;
mod project;
mod recent;
mod state;

use state::AppState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_recent_projects,
            commands::open_project,
            commands::create_project,
            commands::pick_project_folder,
            commands::pick_project_parent_folder,
            commands::create_diagram,
            commands::load_diagram,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
