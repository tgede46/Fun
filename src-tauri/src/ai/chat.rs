use super::client::{chat_completion_resolved, ChatMessage, ContentPart, ImageUrlRef, MessageContent};
use super::model::DEFAULT_FREE_MODEL;
use super::intent::{detect_persona, is_diagram_draw_request, is_reset_request, Persona};
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
    /// Diagramme créé automatiquement car aucun n'était ouvert.
    pub opened_diagram_path: Option<String>,
    pub opened_diagram_name: Option<String>,
}

pub async fn send_chat(
    project_path: &Path,
    diagram_path: Option<&Path>,
    diagram_content: Option<&str>,
    selected_diagram_contents: Vec<String>,
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
            opened_diagram_path: None,
            opened_diagram_name: None,
        });
    }

    let persona = detect_persona(user_message);
    let active = resolve_active_model_for_project(project_path)?;

    let mut opened_diagram_path: Option<String> = None;
    let mut opened_diagram_name: Option<String> = None;
    let mut effective_path: Option<PathBuf> = diagram_path.map(PathBuf::from);
    let mut effective_content: Option<String> = diagram_content.map(String::from);

    if persona == Persona::Editeur && effective_path.is_none() {
        if is_diagram_draw_request(user_message) {
            let path = diagram::create_diagram(project_path)?;
            let content = diagram::load_diagram(project_path, &path)?;
            let name = path
                .file_stem()
                .and_then(|n: &std::ffi::OsStr| n.to_str())
                .unwrap_or("diagramme")
                .to_string();
            opened_diagram_path = Some(path.to_string_lossy().into_owned());
            opened_diagram_name = Some(name);
            effective_path = Some(path);
            effective_content = Some(content);
        } else {
            return Err(
                "Ouvrez un diagramme (liste en haut) ou demandez par ex. « Crée un diagramme de \
                 démo… » pour que Trace dessine sur le canvas."
                    .to_string(),
            );
        }
    }

    let plantuml_mode = effective_path
        .as_ref()
        .and_then(|p| p.extension())
        .and_then(|e| e.to_str())
        == Some("puml");

    let system = system_prompt(
        persona,
        effective_content.as_deref(),
        &selected_diagram_contents,
        plantuml_mode,
    );
    let mut messages: Vec<ChatMessage<'_>> = vec![ChatMessage::text("system", &system)];

    for turn in history {
        let role = if turn.role == "assistant" {
            "assistant"
        } else {
            "user"
        };
        messages.push(ChatMessage::text(role, &turn.content));
    }

    messages.push(ChatMessage::text("user", user_message));

    let raw = chat_completion_resolved(&api_key, &active.model_id, messages).await?;
    let (text, diagram_update) = parse_assistant_response(persona, &raw, plantuml_mode);

    if let (Some(json), Some(path)) = (&diagram_update, effective_path.as_ref()) {
        diagram::save_diagram(project_path, path, json)?;
    }

    Ok(SendChatResult {
        assistant_message: text,
        persona: persona.as_str().to_string(),
        persona_display: persona.display_name().to_string(),
        diagram_update,
        diagram_reset: false,
        opened_diagram_path,
        opened_diagram_name,
    })
}

fn parse_assistant_response(
    persona: Persona,
    raw: &str,
    plantuml_mode: bool,
) -> (String, Option<String>) {
    if persona != Persona::Editeur {
        return (raw.trim().to_string(), None);
    }

    if plantuml_mode {
        if let Some(puml) = extract_plantuml_source(raw) {
            return (prose_before_fence(raw), Some(puml));
        }
        return (raw.trim().to_string(), None);
    }

    if let Some(json) = extract_excalidraw_json(raw) {
        let text = prose_before_fence(raw);
        return (text, Some(json));
    }

    let trimmed = raw.trim();
    if trimmed.contains("```mermaid") {
        return (
            "Trace n'a pas renvoyé de JSON Excalidraw (Mermaid ignoré). Reformulez : « Crée un \
             diagramme de démo avec un flux Début → Action → Fin »."
                .to_string(),
            None,
        );
    }

    (trimmed.to_string(), None)
}

fn prose_before_fence(raw: &str) -> String {
    let text = raw.split("```").next().unwrap_or(raw).trim().to_string();
    if text.is_empty() {
        "Diagramme créé sur le canvas.".to_string()
    } else {
        text
    }
}

fn extract_excalidraw_json(raw: &str) -> Option<String> {
    if let Some(json) = extract_excalidraw_fence(raw) {
        if diagram::validate_excalidraw_json(&json).is_ok() {
            return Some(json);
        }
    }

    extract_json_payload(raw)
        .ok()
        .filter(|json| diagram::validate_excalidraw_json(json).is_ok())
}

fn extract_excalidraw_fence(raw: &str) -> Option<String> {
    for marker in ["```excalidraw-json", "```json", "```"] {
        let Some(start_idx) = raw.find(marker) else {
            continue;
        };
        let start = start_idx + marker.len();
        let rest = raw[start..].trim_start();
        let end = rest.find("```")?;
        let candidate = rest[..end].trim();
        if candidate.starts_with('{') {
            return Some(candidate.to_string());
        }
    }
    None
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
        ChatMessage::text(
            "system",
            "Tu es Atlas, architecte code→diagramme pour Fun. JSON Excalidraw strict.",
        ),
        ChatMessage::text("user", &prompt),
    ];

    let raw = chat_completion_resolved(&api_key, &active.model_id, messages).await?;
    let json = extract_json_payload(&raw)?;
    diagram::validate_excalidraw_json(&json)?;

    let path = diagram::write_uml_diagram(project_root, &json)?;
    Ok(path)
}

pub async fn generate_diagram_from_image(
    project_root: &Path,
    image_base64: &str,
    mime: &str,
) -> Result<PathBuf, String> {
    let api_key = load_api_key()?.ok_or_else(|| {
        "Définissez OPENROUTER_API_KEY dans le fichier .env.".to_string()
    })?;

    let safe_mime = match mime.trim().to_ascii_lowercase().as_str() {
        "image/png" | "image/jpeg" | "image/jpg" | "image/webp" | "image/gif" => {
            if mime == "image/jpg" {
                "image/jpeg"
            } else {
                mime.trim()
            }
        }
        _ => "image/png",
    };

    let data_url = format!("data:{safe_mime};base64,{image_base64}");
    let prompt = "Observe ce schéma ou cette capture. Produis UNIQUEMENT un source PlantUML \
                  valide qui reproduit la structure (classes, flux, acteurs, notes). \
                  Commence par @startuml et termine par @enduml. Pas de prose, pas de JSON, \
                  pas de Markdown autour.";

    let messages = vec![
        ChatMessage::text(
            "system",
            "Tu es Atlas. Tu reconstruis un diagramme à partir d'une image. Sortie PlantUML stricte.",
        ),
        ChatMessage {
            role: "user",
            content: MessageContent::Parts(vec![
                ContentPart::Text { text: prompt },
                ContentPart::ImageUrl {
                    image_url: ImageUrlRef { url: &data_url },
                },
            ]),
        },
    ];

    let raw = chat_completion_resolved(&api_key, DEFAULT_FREE_MODEL, messages)
        .await
        .map_err(|err| {
            if err.to_lowercase().contains("image")
                || err.to_lowercase().contains("no endpoints")
            {
                "Aucun modèle vision gratuit disponible pour cette image. Réessaie plus tard."
                    .to_string()
            } else {
                err
            }
        })?;

    let puml = extract_plantuml_source(&raw)
        .ok_or_else(|| "Génération échouée — PlantUML invalide.".to_string())?;

    diagram::write_capture_diagram(project_root, diagram::DiagramKind::Plantuml, &puml)
}

fn extract_plantuml_source(raw: &str) -> Option<String> {
    for marker in ["```plantuml", "```puml", "```"] {
        if let Some(start_idx) = raw.find(marker) {
            let rest = raw[start_idx + marker.len()..].trim_start();
            if let Some(end) = rest.find("```") {
                let candidate = rest[..end].trim();
                if candidate.contains("@startuml") {
                    return Some(candidate.to_string());
                }
            }
        }
    }

    let trimmed = raw.trim();
    if trimmed.contains("@startuml") && trimmed.contains("@enduml") {
        return Some(trimmed.to_string());
    }

    None
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::ai::intent::Persona;

    const SAMPLE_JSON: &str = r#"{"type":"excalidraw","version":2,"elements":[{"id":"a","type":"rectangle","x":0,"y":0,"width":100,"height":50}],"appState":{},"files":{}}"#;

    #[test]
    fn parse_editeur_extracts_excalidraw_fence() {
        let raw = format!("Voici la démo.\n```excalidraw-json\n{SAMPLE_JSON}\n```");
        let (text, json) = parse_assistant_response(Persona::Editeur, &raw, false);
        assert!(json.is_some());
        assert!(text.contains("démo"));
    }

    #[test]
    fn parse_assistant_ignores_json() {
        let raw = format!("```excalidraw-json\n{SAMPLE_JSON}\n```");
        let (_, json) = parse_assistant_response(Persona::Assistant, &raw, false);
        assert!(json.is_none());
    }

    #[test]
    #[test]
    fn parse_editeur_extracts_plantuml_fence() {
        let raw = "Voici.\n```plantuml\n@startuml\nA --> B\n@enduml\n```";
        let (text, src) = parse_assistant_response(Persona::Editeur, raw, true);
        assert!(src.unwrap().contains("@startuml"));
        assert!(text.contains("Voici"));
    }

    #[test]
    fn parse_editeur_rejects_mermaid() {
        let raw = "```mermaid\nflowchart TD\n  A-->B\n```";
        let (text, json) = parse_assistant_response(Persona::Editeur, raw, false);
        assert!(json.is_none());
        assert!(text.contains("Mermaid"));
    }
}
