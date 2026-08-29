use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";
const AI_FILE: &str = "ai.json";

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
pub struct AiConfig {
    pub active_model: Option<String>,
    pub last_benchmark_at: Option<String>,
    pub last_scores: Option<serde_json::Value>,
}

fn ai_path(project_root: &Path) -> PathBuf {
    project_root.join(FUN_DIR).join(AI_FILE)
}

pub fn read_ai_config(project_root: &Path) -> Result<AiConfig, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let path = ai_path(project_root);
    if !path.exists() {
        return Ok(AiConfig::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}
