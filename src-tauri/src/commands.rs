use crate::project::init;
use crate::recent::{list_recent_projects, touch_recent_project, RecentProject};
use crate::state::AppState;
use serde::Serialize;
use std::path::PathBuf;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize)]
pub struct OpenProjectResult {
    pub path: String,
    pub name: String,
    pub fun_created: bool,
}

#[tauri::command]
pub fn get_recent_projects(app: AppHandle) -> Result<Vec<RecentProject>, String> {
    list_recent_projects(app)
}

#[tauri::command]
pub fn open_project(
    app: AppHandle,
    state: State<'_, AppState>,
    project_path: String,
) -> Result<OpenProjectResult, String> {
    let path_buf = PathBuf::from(&project_path);
    if !path_buf.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let fun_created = init::ensure_fun_structure(&path_buf)?;
    let entry = touch_recent_project(app, project_path.clone())?;

    if let Ok(mut current) = state.current_project.lock() {
        *current = Some(project_path);
    }

    Ok(OpenProjectResult {
        path: entry.path,
        name: entry.name,
        fun_created,
    })
}

#[tauri::command]
pub fn pick_project_folder(app: AppHandle) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("Ouvrir un projet")
        .blocking_pick_folder();

    Ok(picked.map(|path| path.to_string()))
}
