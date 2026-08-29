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

pub fn write_ai_config(project_root: &Path, config: &AiConfig) -> Result<(), String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let path = ai_path(project_root);
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    let content = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&path, content).map_err(|e| e.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;

    fn tmp_project() -> PathBuf {
        let id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = PathBuf::from(format!("/tmp/fun_test_{id}"));
        fs::create_dir_all(root.join(".fun")).unwrap();
        root
    }

    #[test]
    fn read_ai_config_returns_default_when_missing() {
        let root = tmp_project();
        let config = read_ai_config(&root).unwrap();
        assert_eq!(config, AiConfig::default());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn write_and_read_ai_config_roundtrip() {
        let root = tmp_project();
        let config = AiConfig {
            active_model: Some("meta-llama/llama-3.2-3b-instruct:free".to_string()),
            last_benchmark_at: Some("2026-08-29T00:00:00Z".to_string()),
            last_scores: Some(serde_json::json!({"model_a": 85.0})),
        };
        write_ai_config(&root, &config).unwrap();
        let read_back = read_ai_config(&root).unwrap();
        assert_eq!(read_back, config);
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn read_ai_config_handles_corrupted_file() {
        let root = tmp_project();
        fs::write(root.join(".fun/ai.json"), "{{invalid json").unwrap();
        let result = read_ai_config(&root);
        assert!(result.is_err());
        let _ = fs::remove_dir_all(&root);
    }
}
