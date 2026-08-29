use tauri::AppHandle;
use tauri_plugin_notification::NotificationExt;

use crate::project::settings;

#[tauri::command]
pub fn notify_pomodoro_phase(app: AppHandle, title: String, body: String) -> Result<(), String> {
    app.notification()
        .builder()
        .title(&title)
        .body(&body)
        .show()
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn set_pomodoro_durations(
    project_path: String,
    work_minutes: u32,
    break_minutes: u32,
) -> Result<crate::commands::ProjectSettingsResult, String> {
    let project_root = std::path::PathBuf::from(&project_path);
    let updated = settings::set_pomodoro_durations(
        project_root.as_path(),
        work_minutes,
        break_minutes,
    )?;

    Ok(crate::commands::settings_to_result(updated))
}
