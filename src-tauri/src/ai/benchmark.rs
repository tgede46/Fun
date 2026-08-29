use chrono::{Duration, Utc};
use serde::{Deserialize, Serialize};
use std::cmp::Ordering;

use crate::ai::client::{chat_completion, ChatMessage};
use crate::ai::model::DEFAULT_FREE_MODEL;
use crate::project::ai_config;

/// Modèles candidats `:free` évalués par le benchmark.
const CANDIDATE_MODELS: &[&str] = &[
    "google/gemma-2-9b-it:free",
    "meta-llama/llama-3.2-3b-instruct:free",
    "microsoft/phi-3-mini-128k-instruct:free",
    "mistralai/mistral-7b-instruct:free",
    "qwen/qwen-2-7b-instruct:free",
];

/// Intervalle en jours entre deux benchmarks.
const BENCHMARK_STALENESS_DAYS: i64 = 3;

/// Poids du score composite (somme = 100).
const WEIGHT_SUCCESS: f64 = 50.0;
const WEIGHT_SIZE: f64 = 30.0;
const WEIGHT_EXCALIDRAW: f64 = 20.0;

/// Score détaillé pour un modèle testé.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ModelScore {
    pub success: bool,
    pub response_len: usize,
    pub excalidraw_valid: bool,
    pub composite: f64,
}

/// Résultat complet d'un benchmark.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct BenchmarkResult {
    pub active_model: String,
    pub scores: std::collections::HashMap<String, ModelScore>,
    pub ran_at: String,
}

fn prompt_chat_smoke() -> Vec<ChatMessage<'static>> {
    vec![ChatMessage {
        role: "user",
        content: "Réponds juste \"pong\" sans rien ajouter.",
    }]
}

fn prompt_json_diagram() -> Vec<ChatMessage<'static>> {
    vec![ChatMessage {
        role: "user",
        content: concat!(
            "Génère un objet JSON Excalidraw minimaliste qui contient un seul élément ",
            "(type rectangle). Réponds UNIQUEMENT avec le JSON, pas de texte autour.",
            "\n\nFormat attendu:\n",
            r#"{"type":"excalidraw","version":2,"elements":[{"id":"box1","type":"rectangle","x":0,"y":0,"width":100,"height":50}],"appState":{},"files":{}}"#,
        ),
    }]
}

fn prompt_code_to_uml() -> Vec<ChatMessage<'static>> {
    vec![ChatMessage {
        role: "user",
        content: concat!(
            "Décris cette classe Python en JSON Excalidraw (un rectangle avec le nom de la classe). ",
            "Classe: Animal avec attributs name et age. ",
            "Réponds UNIQUEMENT avec le JSON, pas de texte autour.",
            "\n\nFormat attendu:\n",
            r#"{"type":"excalidraw","version":2,"elements":[{"id":"cls1","type":"rectangle","x":0,"y":0,"width":200,"height":100}],"appState":{},"files":{}}"#,
        ),
    }]
}

fn is_valid_excalidraw_json(text: &str) -> bool {
    let trimmed = text.trim();
    let json = if let Some(fence_start) = trimmed.find("```").and_then(|i| {
        let after = &trimmed[i + 3..];
        Some(after.trim_start_matches("json").trim_start())
    }) {
        fence_start.trim_end_matches("```").trim()
    } else {
        trimmed
    };

    let parsed = match serde_json::from_str::<serde_json::Value>(json) {
        Ok(v) => v,
        Err(_) => return false,
    };

    parsed.get("type").and_then(|v| v.as_str()) == Some("excalidraw")
        && parsed.get("elements").and_then(|v| v.as_array()).is_some()
}

fn compute_score(success: bool, response_len: usize, excalidraw_valid: bool) -> f64 {
    let success_score = if success { WEIGHT_SUCCESS } else { 0.0 };

    let size_score = if response_len > 0 && response_len < 5000 {
        WEIGHT_SIZE
    } else if response_len >= 5000 {
        WEIGHT_SIZE * 0.5
    } else {
        0.0
    };

    let excalidraw_score = if excalidraw_valid {
        WEIGHT_EXCALIDRAW
    } else {
        0.0
    };

    success_score + size_score + excalidraw_score
}

async fn evaluate_response(api_key: &str, model: &str, messages: Vec<ChatMessage<'_>>) -> ModelScore {
    match chat_completion(api_key, model, messages).await {
        Ok(response) => {
            let success = !response.trim().is_empty();
            let response_len = response.len();
            let excalidraw_valid = is_valid_excalidraw_json(&response);
            let composite = compute_score(success, response_len, excalidraw_valid);
            ModelScore {
                success,
                response_len,
                excalidraw_valid,
                composite,
            }
        }
        Err(_) => ModelScore {
            success: false,
            response_len: 0,
            excalidraw_valid: false,
            composite: 0.0,
        },
    }
}

/// Exécute la suite de benchmark sur tous les modèles candidats.
pub async fn run_benchmark(
    api_key: &str,
    candidate_models: Option<&[&str]>,
) -> Result<BenchmarkResult, String> {
    let models = candidate_models.unwrap_or(CANDIDATE_MODELS);

    let mut scores = std::collections::HashMap::new();

    for &model in models {
        // Scénario 1 : chat smoke
        let score_chat = evaluate_response(api_key, model, prompt_chat_smoke()).await;

        // Si le chat échoue, on score à 0 pour ce modèle
        if !score_chat.success {
            scores.insert(
                model.to_string(),
                ModelScore {
                    success: false,
                    response_len: 0,
                    excalidraw_valid: false,
                    composite: 0.0,
                },
            );
            continue;
        }

        // Scénario 2 : JSON diagramme valide
        let score_json = evaluate_response(api_key, model, prompt_json_diagram()).await;

        // Scénario 3 : code→UML smoke
        let score_uml = evaluate_response(api_key, model, prompt_code_to_uml()).await;

        // Score composite : somme des trois scénarios
        let composite = (score_chat.composite + score_json.composite + score_uml.composite) / 3.0;

        scores.insert(
            model.to_string(),
            ModelScore {
                success: true,
                response_len: score_chat.response_len
                    + score_json.response_len
                    + score_uml.response_len,
                excalidraw_valid: score_json.excalidraw_valid || score_uml.excalidraw_valid,
                composite,
            },
        );
    }

    let active_model = select_best_model(&scores);

    Ok(BenchmarkResult {
        active_model,
        scores,
        ran_at: Utc::now().to_rfc3339(),
    })
}

/// Résultat du check de fraîcheur du benchmark.
#[derive(Debug, Clone, PartialEq)]
pub enum StalenessCheck {
    /// Le benchmark est à jour (moins de 3 jours).
    Fresh,
    /// Le benchmark est périmé et a été exécuté avec succès.
    Ran(BenchmarkResult),
    /// Le benchmark est périmé mais a échoué — l'ancien modèle est conservé.
    Failed(String),
}

/// Vérifie si le benchmark est périmé (>3 jours) et l'exécute si nécessaire.
pub async fn check_and_run_if_stale(
    api_key: &str,
    project_root: &std::path::Path,
) -> Result<StalenessCheck, String> {
    let config = ai_config::read_ai_config(project_root).unwrap_or_default();

    if let Some(ref last_at) = config.last_benchmark_at {
        if let Ok(parsed) = chrono::DateTime::parse_from_rfc3339(last_at) {
            let elapsed = Utc::now() - parsed.with_timezone(&Utc);
            if elapsed < Duration::days(BENCHMARK_STALENESS_DAYS) {
                return Ok(StalenessCheck::Fresh);
            }
        }
    }

    match run_benchmark(api_key, None).await {
        Ok(result) => {
            let mut new_config = config;
            new_config.active_model = Some(result.active_model.clone());
            new_config.last_benchmark_at = Some(result.ran_at.clone());
            new_config.last_scores =
                Some(serde_json::to_value(&result.scores).unwrap_or_default());
            if let Err(e) = ai_config::write_ai_config(project_root, &new_config) {
                eprintln!("[benchmark] Échec écriture config : {e}");
                return Err(format!("Benchmark terminé mais écriture config échouée : {e}"));
            }
            Ok(StalenessCheck::Ran(result))
        }
        Err(e) => {
            eprintln!("[benchmark] Échoué, ancien modèle conservé : {e}");
            Ok(StalenessCheck::Failed(e))
        }
    }
}

/// Sélectionne le modèle avec le meilleur score composite.
/// Retourne le seed par défaut si aucun score n'est disponible.
pub fn select_best_model(scores: &std::collections::HashMap<String, ModelScore>) -> String {
    let best = scores.iter().filter(|(_, s)| s.success).max_by(|a, b| {
        a.1.composite
            .partial_cmp(&b.1.composite)
            .unwrap_or(Ordering::Equal)
    });

    match best {
        Some((model, _)) => model.clone(),
        None => DEFAULT_FREE_MODEL.to_string(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn compute_score_all_success() {
        let score = compute_score(true, 100, true);
        assert!((score - 100.0).abs() < f64::EPSILON);
    }

    #[test]
    fn compute_score_failure() {
        let score = compute_score(false, 0, false);
        assert!((score - 0.0).abs() < f64::EPSILON);
    }

    #[test]
    fn compute_score_success_no_excalidraw() {
        let score = compute_score(true, 100, false);
        assert!((score - 80.0).abs() < f64::EPSILON);
    }

    #[test]
    fn select_best_model_prefers_highest_score() {
        let mut scores = std::collections::HashMap::new();
        scores.insert(
            "model_a".to_string(),
            ModelScore {
                success: true,
                response_len: 100,
                excalidraw_valid: true,
                composite: 90.0,
            },
        );
        scores.insert(
            "model_b".to_string(),
            ModelScore {
                success: true,
                response_len: 200,
                excalidraw_valid: false,
                composite: 70.0,
            },
        );
        let best = select_best_model(&scores);
        assert_eq!(best, "model_a");
    }

    #[test]
    fn select_best_model_returns_default_when_empty() {
        let scores = std::collections::HashMap::new();
        let best = select_best_model(&scores);
        assert_eq!(best, DEFAULT_FREE_MODEL);
    }

    #[test]
    fn select_best_model_skips_failed_models() {
        let mut scores = std::collections::HashMap::new();
        scores.insert(
            "failed_model".to_string(),
            ModelScore {
                success: false,
                response_len: 0,
                excalidraw_valid: false,
                composite: 0.0,
            },
        );
        scores.insert(
            "good_model".to_string(),
            ModelScore {
                success: true,
                response_len: 100,
                excalidraw_valid: true,
                composite: 80.0,
            },
        );
        let best = select_best_model(&scores);
        assert_eq!(best, "good_model");
    }

    #[test]
    fn is_valid_excalidraw_json_accepts_valid() {
        let json = r#"{"type":"excalidraw","version":2,"elements":[{"id":"box1","type":"rectangle"}],"appState":{},"files":{}}"#;
        assert!(is_valid_excalidraw_json(json));
    }

    #[test]
    fn is_valid_excalidraw_json_rejects_invalid() {
        assert!(!is_valid_excalidraw_json("ce n'est pas du json"));
        assert!(!is_valid_excalidraw_json(r#"{"type":"not_excalidraw"}"#));
        assert!(!is_valid_excalidraw_json(r#"{"elements":[]}"#));
    }

    #[test]
    fn is_valid_excalidraw_json_handles_markdown_fences() {
        let text = "```json\n{\"type\":\"excalidraw\",\"version\":2,\"elements\":[],\"appState\":{},\"files\":{}}\n```";
        assert!(is_valid_excalidraw_json(text));
    }

    #[test]
    fn is_valid_excalidraw_json_handles_text_before_fence() {
        let text = "Voici le diagramme:\n```json\n{\"type\":\"excalidraw\",\"version\":2,\"elements\":[],\"appState\":{},\"files\":{}}\n```";
        assert!(is_valid_excalidraw_json(text));
    }

}
