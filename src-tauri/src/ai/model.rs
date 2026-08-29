use crate::ai::openrouter::{assert_free_model, is_free_model};
use crate::project::ai_config::{self, AiConfig};

/// Routeur OpenRouter — sélectionne un modèle free disponible (résilient aux rotations).
pub const DEFAULT_FREE_MODEL: &str = "openrouter/free";

/// Modèles retirés d'OpenRouter ; remplacés automatiquement par [`DEFAULT_FREE_MODEL`].
pub const DEPRECATED_FREE_MODELS: &[&str] = &[
    "google/gemma-2-9b-it:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "mistralai/mistral-7b-instruct:free",
];

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ModelSource {
    DefaultSeed,
    Benchmark,
}

impl ModelSource {
    pub fn as_str(&self) -> &'static str {
        match self {
            ModelSource::DefaultSeed => "default",
            ModelSource::Benchmark => "benchmark",
        }
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ActiveModelInfo {
    pub model_id: String,
    pub source: ModelSource,
}

pub fn is_deprecated_free_model(model_id: &str) -> bool {
    DEPRECATED_FREE_MODELS.contains(&model_id.trim())
}

pub fn normalize_free_model(model_id: &str) -> String {
    let trimmed = model_id.trim();
    if trimmed.is_empty() || is_deprecated_free_model(trimmed) {
        DEFAULT_FREE_MODEL.to_string()
    } else {
        trimmed.to_string()
    }
}

pub fn resolve_active_model(ai_config: &AiConfig) -> ActiveModelInfo {
    if let Some(model) = ai_config.active_model.as_deref() {
        let normalized = normalize_free_model(model);
        if is_free_model(&normalized) {
            let source = if normalized == model.trim() && !is_deprecated_free_model(model) {
                ModelSource::Benchmark
            } else {
                ModelSource::DefaultSeed
            };
            return ActiveModelInfo {
                model_id: normalized,
                source,
            };
        }
    }

    ActiveModelInfo {
        model_id: DEFAULT_FREE_MODEL.to_string(),
        source: ModelSource::DefaultSeed,
    }
}

pub fn resolve_active_model_for_project(
    project_root: &std::path::Path,
) -> Result<ActiveModelInfo, String> {
    let mut config = ai_config::read_ai_config(project_root)?;
    let info = resolve_active_model(&config);

    if let Some(stored) = config.active_model.as_deref() {
        let normalized = normalize_free_model(stored);
        if normalized != stored.trim() {
            config.active_model = Some(normalized.clone());
            ai_config::write_ai_config(project_root, &config)?;
        }
    }

    assert_free_model(&info.model_id)?;
    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::project::ai_config::AiConfig;
    use std::fs;

    fn tmp_project() -> std::path::PathBuf {
        let id = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = std::path::PathBuf::from(format!("/tmp/fun_model_test_{id}"));
        fs::create_dir_all(root.join(".fun")).unwrap();
        root
    }

    #[test]
    fn resolve_active_model_uses_seed_when_missing() {
        let info = resolve_active_model(&AiConfig::default());
        assert_eq!(info.model_id, DEFAULT_FREE_MODEL);
        assert_eq!(info.source, ModelSource::DefaultSeed);
    }

    #[test]
    fn resolve_active_model_uses_benchmark_value() {
        let config = AiConfig {
            active_model: Some("meta-llama/llama-3.2-3b-instruct:free".to_string()),
            last_benchmark_at: Some("2026-08-29T00:00:00Z".to_string()),
            last_scores: None,
            ..Default::default()
        };
        let info = resolve_active_model(&config);
        assert_eq!(info.source, ModelSource::Benchmark);
    }

    #[test]
    fn normalize_free_model_replaces_deprecated_gemma() {
        assert_eq!(
            normalize_free_model("google/gemma-2-9b-it:free"),
            DEFAULT_FREE_MODEL
        );
    }

    #[test]
    fn resolve_active_model_for_project_migrates_deprecated_model() {
        let root = tmp_project();
        let config = AiConfig {
            active_model: Some("google/gemma-2-9b-it:free".to_string()),
            ..Default::default()
        };
        ai_config::write_ai_config(&root, &config).unwrap();

        let info = resolve_active_model_for_project(&root).unwrap();
        assert_eq!(info.model_id, DEFAULT_FREE_MODEL);

        let read_back = ai_config::read_ai_config(&root).unwrap();
        assert_eq!(
            read_back.active_model.as_deref(),
            Some(DEFAULT_FREE_MODEL)
        );

        let _ = fs::remove_dir_all(&root);
    }
}
