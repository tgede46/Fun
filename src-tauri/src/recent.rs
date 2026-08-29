use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::{AppHandle, Manager};

const MAX_RECENTS: usize = 10;
const STORE_FILE: &str = "recent_projects.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct RecentStore {
    projects: Vec<RecentProject>,
}

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
        .map(|dir| dir.join(STORE_FILE))
}

fn read_store(path: &Path) -> RecentStore {
    if !path.exists() {
        return RecentStore::default();
    }

    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

fn write_store(path: &Path, store: &RecentStore) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let raw = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;
    fs::write(path, raw).map_err(|e| e.to_string())
}

fn project_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or("Projet")
        .to_string()
}

fn iso_timestamp() -> String {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{now}")
}

pub fn list_recent_projects(app: AppHandle) -> Result<Vec<RecentProject>, String> {
    let path = store_path(&app)?;
    let mut store = read_store(&path);
    let before = store.projects.len();
    store
        .projects
        .retain(|project| Path::new(&project.path).is_dir());
    store.projects.sort_by(|a, b| b.last_opened.cmp(&a.last_opened));

    if store.projects.len() != before {
        write_store(&path, &store)?;
    }

    Ok(store.projects)
}

pub fn touch_recent_project(app: AppHandle, project_path: String) -> Result<RecentProject, String> {
    let path_buf = PathBuf::from(&project_path);
    if !path_buf.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let entry = RecentProject {
        path: project_path.clone(),
        name: project_name(&path_buf),
        last_opened: iso_timestamp(),
    };

    let store_path = store_path(&app)?;
    let mut store = read_store(&store_path);
    store.projects.retain(|p| p.path != project_path);
    store.projects.insert(0, entry.clone());

    if store.projects.len() > MAX_RECENTS {
        store.projects.truncate(MAX_RECENTS);
    }

    write_store(&store_path, &store)?;
    Ok(entry)
}
