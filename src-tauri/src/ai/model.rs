use crate::ai::openrouter::{assert_free_model, is_free_model};
use crate::project::ai_config::{self, AiConfig};

pub const DEFAULT_FREE_MODEL: &str = "google/gemma-2-9b-it:free";

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

pub fn resolve_active_model(ai_config: &AiConfig) -> ActiveModelInfo {
    if let Some(model) = ai_config.active_model.as_deref() {
        let trimmed = model.trim();
        if !trimmed.is_empty() && is_free_model(trimmed) {
            return ActiveModelInfo {
                model_id: trimmed.to_string(),
                source: ModelSource::Benchmark,
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
    let config = ai_config::read_ai_config(project_root)?;
    let info = resolve_active_model(&config);
    assert_free_model(&info.model_id)?;
    Ok(info)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::project::ai_config::AiConfig;

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
        };
        let info = resolve_active_model(&config);
        assert_eq!(info.source, ModelSource::Benchmark);
    }
}
