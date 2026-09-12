use chrono::Utc;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";

#[derive(Debug, Serialize, Deserialize)]
struct ProjectJson {
    name: String,
    root_path: String,
    created_at: String,
    fun_version: u32,
}

#[derive(Debug, Serialize, Deserialize)]
struct SettingsJson {
    pomodoro_work_minutes: u32,
    pomodoro_break_minutes: u32,
    #[serde(default = "default_theme")]
    theme: String,
}

fn default_theme() -> String {
    "light".to_string()
}

#[derive(Debug, Serialize, Deserialize)]
struct AiJson {
    active_model: Option<String>,
    last_benchmark_at: Option<String>,
    last_scores: Option<serde_json::Value>,
}

fn fun_dir(project_root: &Path) -> PathBuf {
    project_root.join(FUN_DIR)
}

fn write_if_missing(path: &Path, content: &str) -> Result<(), String> {
    if path.exists() {
        return Ok(());
    }
    fs::write(path, content).map_err(|e| e.to_string())
}

fn default_project_json(project_root: &Path) -> Result<String, String> {
    let name = project_root
        .file_name()
        .and_then(|n| n.to_str())
        .filter(|n| !n.is_empty())
        .unwrap_or("Projet")
        .to_string();

    let payload = ProjectJson {
        name,
        root_path: project_root
            .to_string_lossy()
            .into_owned(),
        created_at: Utc::now().to_rfc3339(),
        fun_version: 1,
    };

    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}

fn default_settings_json() -> Result<String, String> {
    let payload = SettingsJson {
        pomodoro_work_minutes: 25,
        pomodoro_break_minutes: 5,
        theme: default_theme(),
    };
    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}

fn default_ai_json() -> Result<String, String> {
    let payload = AiJson {
        active_model: None,
        last_benchmark_at: None,
        last_scores: None,
    };
    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}

/// Creates `.fun/` and default files if missing. Returns true when `.fun/` did not exist before.
pub fn ensure_fun_structure(project_root: &Path) -> Result<bool, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let fun_path = fun_dir(project_root);
    let created = !fun_path.exists();
    fs::create_dir_all(&fun_path).map_err(|e| e.to_string())?;

    let diagrams = fun_path.join("diagrams");
    if !diagrams.exists() {
        fs::create_dir_all(&diagrams).map_err(|e| e.to_string())?;
    }

    // Cache RAG lexical + overlay knowledge utilisateur
    let rag = fun_path.join("rag");
    if !rag.exists() {
        fs::create_dir_all(&rag).map_err(|e| e.to_string())?;
    }
    let knowledge = fun_path.join("knowledge");
    if !knowledge.exists() {
        fs::create_dir_all(&knowledge).map_err(|e| e.to_string())?;
    }

    write_if_missing(
        &fun_path.join("project.json"),
        &default_project_json(project_root)?,
    )?;
    write_if_missing(
        &fun_path.join("settings.json"),
        &default_settings_json()?,
    )?;
    write_if_missing(&fun_path.join("ai.json"), &default_ai_json()?)?;

    Ok(created)
}
