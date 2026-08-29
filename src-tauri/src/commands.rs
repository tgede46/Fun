use crate::ai::{self, resolve_active_model_for_project};
use crate::project::diagram;
use crate::project::init;
use crate::project::settings::{self, FunTheme, ProjectSettings};
use crate::recent::{list_recent_projects, touch_recent_project, RecentProject};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, State};
use tauri_plugin_dialog::DialogExt;

#[derive(Debug, Serialize)]
pub struct OpenProjectResult {
    pub path: String,
    pub name: String,
    pub fun_created: bool,
}

#[derive(Debug, Serialize)]
pub struct CreateDiagramResult {
    pub path: String,
    pub name: String,
}

#[derive(Debug, Serialize)]
pub struct LoadDiagramResult {
    pub path: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct ProjectSettingsResult {
    pub pomodoro_work_minutes: u32,
    pub pomodoro_break_minutes: u32,
    pub theme: String,
}

#[derive(Debug, Serialize)]
pub struct DiagramListItem {
    pub path: String,
    pub name: String,
}

pub fn settings_to_result(settings: ProjectSettings) -> ProjectSettingsResult {
    ProjectSettingsResult {
        pomodoro_work_minutes: settings.pomodoro_work_minutes,
        pomodoro_break_minutes: settings.pomodoro_break_minutes,
        theme: settings.theme.as_str().to_string(),
    }
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
    open_project_at(app, state, PathBuf::from(project_path))
}

#[tauri::command]
pub async fn pick_project_folder(app: AppHandle) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("Ouvrir un projet")
        .blocking_pick_folder();

    Ok(picked.map(|path| path.to_string()))
}

#[tauri::command]
pub async fn pick_project_parent_folder(app: AppHandle) -> Result<Option<String>, String> {
    let picked = app
        .dialog()
        .file()
        .set_title("Emplacement du nouveau projet")
        .blocking_pick_folder();

    Ok(picked.map(|path| path.to_string()))
}

fn validate_project_name(name: &str) -> Result<(), String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Le nom du projet est requis.".to_string());
    }
    if trimmed == "." || trimmed == ".." {
        return Err("Nom de projet invalide.".to_string());
    }
    if trimmed.contains('/') || trimmed.contains('\\') {
        return Err("Le nom ne peut pas contenir de slash.".to_string());
    }
    Ok(())
}

#[tauri::command]
pub fn create_project(
    app: AppHandle,
    state: State<'_, AppState>,
    parent_path: String,
    project_name: String,
) -> Result<OpenProjectResult, String> {
    validate_project_name(&project_name)?;
    let name = project_name.trim();

    let parent = PathBuf::from(&parent_path);
    if !parent.is_dir() {
        return Err("Le dossier parent est introuvable.".to_string());
    }

    let project_path = parent.join(name);
    if project_path.exists() {
        return Err("Un dossier avec ce nom existe déjà.".to_string());
    }

    fs::create_dir(&project_path).map_err(|e| e.to_string())?;
    open_project_at(app, state, project_path)
}

#[tauri::command]
pub fn create_diagram(project_path: String) -> Result<CreateDiagramResult, String> {
    let project_root = PathBuf::from(&project_path);
    let diagram_path = diagram::create_diagram(project_root.as_path())?;
    let name = diagram_path
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("diagramme")
        .to_string();

    Ok(CreateDiagramResult {
        path: diagram_path.to_string_lossy().into_owned(),
        name,
    })
}

#[tauri::command]
pub fn load_diagram(project_path: String, diagram_path: String) -> Result<LoadDiagramResult, String> {
    let project_root = PathBuf::from(&project_path);
    let path = PathBuf::from(&diagram_path);
    let content = diagram::load_diagram(project_root.as_path(), path.as_path())?;

    Ok(LoadDiagramResult {
        path: diagram_path,
        content,
    })
}

#[tauri::command]
pub fn save_diagram(
    project_path: String,
    diagram_path: String,
    content: String,
) -> Result<(), String> {
    let project_root = PathBuf::from(&project_path);
    let path = PathBuf::from(&diagram_path);
    diagram::save_diagram(project_root.as_path(), path.as_path(), &content)
}

#[tauri::command]
pub fn list_diagrams(project_path: String) -> Result<Vec<DiagramListItem>, String> {
    let project_root = PathBuf::from(&project_path);
    let entries = diagram::list_diagrams(project_root.as_path())?;
    Ok(entries
        .into_iter()
        .map(|entry| DiagramListItem {
            path: entry.path,
            name: entry.name,
        })
        .collect())
}

#[tauri::command]
pub fn delete_diagram(project_path: String, diagram_path: String) -> Result<(), String> {
    let project_root = PathBuf::from(&project_path);
    let path = PathBuf::from(&diagram_path);
    diagram::delete_diagram(project_root.as_path(), path.as_path())
}

#[tauri::command]
pub fn get_project_settings(project_path: String) -> Result<ProjectSettingsResult, String> {
    let project_root = PathBuf::from(&project_path);
    let loaded = settings::read_settings(project_root.as_path())?;
    Ok(settings_to_result(loaded))
}

#[tauri::command]
pub fn set_project_theme(
    project_path: String,
    theme: String,
) -> Result<ProjectSettingsResult, String> {
    let parsed = FunTheme::parse(&theme)?;
    let project_root = PathBuf::from(&project_path);
    let updated = settings::set_theme(project_root.as_path(), parsed)?;
    Ok(settings_to_result(updated))
}

#[derive(Debug, Serialize)]
pub struct AiStatusResult {
    pub key_configured: bool,
    pub active_model: String,
    pub model_source: String,
    pub openrouter_base_url: String,
}

#[tauri::command]
pub fn get_openrouter_key_configured() -> Result<bool, String> {
    ai::has_api_key()
}

#[tauri::command]
pub fn get_ai_status(project_path: String) -> Result<AiStatusResult, String> {
    let key_configured = ai::has_api_key()?;
    let project_root = PathBuf::from(&project_path);
    let active = resolve_active_model_for_project(project_root.as_path())?;

    Ok(AiStatusResult {
        key_configured,
        active_model: active.model_id,
        model_source: active.source.as_str().to_string(),
        openrouter_base_url: ai::OPENROUTER_API_BASE.to_string(),
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ChatTurnInput {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct GenerateDiagramResult {
    pub path: String,
    pub name: String,
}

#[tauri::command]
pub async fn send_chat_message(
    project_path: String,
    diagram_path: Option<String>,
    diagram_content: Option<String>,
    history: Vec<ChatTurnInput>,
    user_message: String,
) -> Result<ai::SendChatResult, String> {
    let project_root = PathBuf::from(&project_path);
    let diagram_ref = diagram_path.as_ref().map(PathBuf::from);
    let history: Vec<ai::ChatTurn> = history
        .into_iter()
        .map(|t| ai::ChatTurn {
            role: t.role,
            content: t.content,
        })
        .collect();

    ai::send_chat(
        project_root.as_path(),
        diagram_ref.as_ref().map(|p| p.as_path()),
        diagram_content.as_deref(),
        &history,
        &user_message,
    )
    .await
}

#[tauri::command]
pub fn reset_diagram(project_path: String, diagram_path: String) -> Result<String, String> {
    let project_root = PathBuf::from(&project_path);
    let path = PathBuf::from(&diagram_path);
    diagram::reset_diagram(project_root.as_path(), path.as_path())
}

#[tauri::command]
pub async fn generate_diagram_from_code(
    project_path: String,
) -> Result<GenerateDiagramResult, String> {
    let project_root = PathBuf::from(&project_path);
    let path = ai::generate_diagram_from_code(project_root.as_path()).await?;
    let name = path
        .file_stem()
        .and_then(|n| n.to_str())
        .unwrap_or("uml")
        .to_string();

    Ok(GenerateDiagramResult {
        path: path.to_string_lossy().into_owned(),
        name,
    })
}

#[derive(Debug, Serialize)]
pub struct RunBenchmarkResult {
    pub active_model: String,
    pub ran_at: String,
    pub scores: std::collections::HashMap<String, ai::ModelScore>,
}

#[tauri::command]
pub async fn run_benchmark(project_path: String) -> Result<RunBenchmarkResult, String> {
    let api_key = ai::load_api_key()?.ok_or("Clé OpenRouter non configurée.")?;
    let project_root = PathBuf::from(&project_path);

    let result = ai::check_and_run_if_stale(&api_key, project_root.as_path()).await?;

    match result {
        ai::StalenessCheck::Ran(benchmark) => Ok(RunBenchmarkResult {
            active_model: benchmark.active_model,
            ran_at: benchmark.ran_at,
            scores: benchmark.scores,
        }),
        ai::StalenessCheck::Fresh | ai::StalenessCheck::Failed(_) => {
            let config = crate::project::ai_config::read_ai_config(project_root.as_path())
                .unwrap_or_default();
            Ok(RunBenchmarkResult {
                active_model: config
                    .active_model
                    .unwrap_or_else(|| ai::model::DEFAULT_FREE_MODEL.to_string()),
                ran_at: config.last_benchmark_at.unwrap_or_default(),
                scores: std::collections::HashMap::new(),
            })
        }
    }
}

fn open_project_at(
    app: AppHandle,
    state: State<'_, AppState>,
    path_buf: PathBuf,
) -> Result<OpenProjectResult, String> {
    if !path_buf.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let project_path = path_buf.to_string_lossy().into_owned();
    let fun_created = init::ensure_fun_structure(path_buf.as_path())?;
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
