mod ai;
mod commands;
mod project;
mod recent;
mod state;

use state::AppState;

fn load_dotenv() {
    if dotenvy::dotenv().is_ok() {
        return;
    }

    let project_env = std::path::PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.env");
    let _ = dotenvy::from_path(project_env);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    load_dotenv();

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
            commands::save_diagram,
            commands::list_diagrams,
            commands::get_project_settings,
            commands::set_project_theme,
            commands::get_openrouter_key_configured,
            commands::get_ai_status,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
