use super::client::{chat_completion, ChatMessage};
use super::intent::{detect_persona, is_reset_request, Persona};
use super::personas::system_prompt;
use crate::ai::model::resolve_active_model_for_project;
use crate::ai::secrets::load_api_key;
use crate::project::diagram;
use serde::{Deserialize, Serialize};
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatTurn {
    pub role: String,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct SendChatResult {
    pub assistant_message: String,
    pub persona: String,
    pub persona_display: String,
    pub diagram_update: Option<String>,
    pub diagram_reset: bool,
}

pub async fn send_chat(
    project_path: &Path,
    diagram_path: Option<&Path>,
    diagram_content: Option<&str>,
    history: &[ChatTurn],
    user_message: &str,
) -> Result<SendChatResult, String> {
    let api_key = load_api_key()?.ok_or_else(|| {
        "Définissez OPENROUTER_API_KEY dans le fichier .env.".to_string()
    })?;

    if is_reset_request(user_message) {
        let path = diagram_path.ok_or_else(|| {
            "Ouvrez un diagramme avant de repartir de zéro.".to_string()
        })?;
        let content = diagram::reset_diagram(project_path, path)?;
        return Ok(SendChatResult {
            assistant_message: "Diagramme réinitialisé — canvas vide, même fichier.".to_string(),
            persona: "relecteur-diagramme".to_string(),
            persona_display: "Claire".to_string(),
            diagram_update: Some(content),
            diagram_reset: true,
        });
    }

    let persona = detect_persona(user_message);
    let active = resolve_active_model_for_project(project_path)?;

    let system = system_prompt(persona, diagram_content);
    let mut messages: Vec<ChatMessage<'_>> = vec![ChatMessage {
        role: "system",
        content: &system,
    }];

    for turn in history {
        let role = if turn.role == "assistant" {
            "assistant"
        } else {
            "user"
        };
        messages.push(ChatMessage {
            role,
            content: &turn.content,
        });
    }

    messages.push(ChatMessage {
        role: "user",
        content: user_message,
    });

    let raw = chat_completion(&api_key, &active.model_id, messages).await?;
    let (text, diagram_update) = parse_assistant_response(persona, &raw);

    Ok(SendChatResult {
        assistant_message: text,
        persona: persona.as_str().to_string(),
        persona_display: persona.display_name().to_string(),
        diagram_update,
        diagram_reset: false,
    })
}

fn parse_assistant_response(
    persona: Persona,
    raw: &str,
) -> (String, Option<String>) {
    if persona != Persona::Editeur {
        return (raw.trim().to_string(), None);
    }

    if let Some(json) = extract_excalidraw_fence(raw) {
        if diagram::validate_excalidraw_json(&json).is_ok() {
            let text = raw
                .split("```")
                .next()
                .unwrap_or(raw)
                .trim()
                .to_string();
            let text = if text.is_empty() {
                "Modification appliquée.".to_string()
            } else {
                text
            };
            return (text, Some(json));
        }
    }

    (raw.trim().to_string(), None)
}

fn extract_excalidraw_fence(raw: &str) -> Option<String> {
    let marker = "```excalidraw-json";
    let start = raw.find(marker)? + marker.len();
    let rest = &raw[start..];
    let end = rest.find("```")?;
    Some(rest[..end].trim().to_string())
}

pub async fn generate_diagram_from_code(project_root: &Path) -> Result<PathBuf, String> {
    let api_key = load_api_key()?.ok_or_else(|| {
        "Définissez OPENROUTER_API_KEY dans le fichier .env.".to_string()
    })?;
    let active = resolve_active_model_for_project(project_root)?;
    let sources = crate::project::code_extract::scan_project_sources(project_root)?;

    if sources.is_empty() {
        return Err("Aucun fichier source trouvé.".to_string());
    }

    let prompt = format!(
        "Analyse ces fichiers source et produis UNIQUEMENT un JSON Excalidraw valide (type \
         excalidraw, version 2) représentant un diagramme de classes ou modules. Pas de prose.\n\n\
         {sources}"
    );

    let messages = vec![
        ChatMessage {
            role: "system",
            content: "Tu es Atlas, architecte code→diagramme pour Fun. JSON Excalidraw strict.",
        },
        ChatMessage {
            role: "user",
            content: &prompt,
        },
    ];

    let raw = chat_completion(&api_key, &active.model_id, messages).await?;
    let json = extract_json_payload(&raw)?;
    diagram::validate_excalidraw_json(&json)?;

    let path = diagram::write_uml_diagram(project_root, &json)?;
    Ok(path)
}

fn extract_json_payload(raw: &str) -> Result<String, String> {
    let trimmed = raw.trim();
    if trimmed.starts_with('{') {
        return Ok(trimmed.to_string());
    }

    if let Some(start) = trimmed.find("```") {
        let rest = &trimmed[start + 3..];
        let rest = rest.strip_prefix("json").unwrap_or(rest).trim_start();
        if let Some(end) = rest.find("```") {
            return Ok(rest[..end].trim().to_string());
        }
    }

    Err("Génération échouée — JSON invalide.".to_string())
}
