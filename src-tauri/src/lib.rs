mod ai;
mod commands;
mod notify;
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
        .plugin(tauri_plugin_notification::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::get_recent_projects,
            commands::open_project,
            commands::create_project,
            commands::pick_project_folder,
            commands::pick_project_parent_folder,
            commands::export_text_file,
            commands::create_diagram,
            commands::create_drawio_diagram,
            commands::create_diagram_of_kind,
            commands::create_diagram_with_content,
            commands::load_diagram,
            commands::save_diagram,
            commands::load_drawio_diagram,
            commands::save_drawio_diagram,
            commands::list_diagrams,
            commands::delete_diagram,
            commands::get_project_settings,
            commands::set_project_theme,
            commands::set_custom_colors,
            commands::set_companion_position,
            commands::set_lofi_prefs,
            commands::get_openrouter_key_configured,
            commands::get_ai_status,
            commands::send_chat_message,
            commands::reset_diagram,
            commands::generate_diagram_from_code,
            commands::generate_diagram_from_image,
            commands::run_benchmark,
            notify::notify_pomodoro_phase,
            notify::notify_chat_complete,
            notify::set_pomodoro_durations,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
