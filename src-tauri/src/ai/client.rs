use serde::{Deserialize, Serialize};
use std::time::Duration;

const MAX_RETRIES: u32 = 3;
const INITIAL_BACKOFF_MS: u64 = 1000;

#[derive(Debug, Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: Vec<ChatMessage<'a>>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(untagged)]
pub enum MessageContent<'a> {
    Text(&'a str),
    Parts(Vec<ContentPart<'a>>),
}

#[derive(Debug, Serialize, Clone)]
#[serde(tag = "type")]
pub enum ContentPart<'a> {
    #[serde(rename = "text")]
    Text { text: &'a str },
    #[serde(rename = "image_url")]
    ImageUrl { image_url: ImageUrlRef<'a> },
}

#[derive(Debug, Serialize, Clone)]
pub struct ImageUrlRef<'a> {
    pub url: &'a str,
}

#[derive(Debug, Serialize, Clone)]
pub struct ChatMessage<'a> {
    pub role: &'a str,
    pub content: MessageContent<'a>,
}

impl<'a> ChatMessage<'a> {
    pub fn text(role: &'a str, content: &'a str) -> Self {
        Self {
            role,
            content: MessageContent::Text(content),
        }
    }
}

#[derive(Debug, Deserialize)]
struct ChatResponseBody {
    choices: Vec<ChatChoice>,
}

#[derive(Debug, Deserialize)]
struct ChatChoice {
    message: ChoiceMessage,
}

#[derive(Debug, Deserialize)]
struct ChoiceMessage {
    content: Option<String>,
}

async fn chat_completion_once(
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage<'_>>,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())?;

    let body = ChatRequest { model, messages };

    let response = client
        .post(format!("{}/chat/completions", super::OPENROUTER_API_BASE))
        .header("Authorization", format!("Bearer {api_key}"))
        .header("HTTP-Referer", "https://fun.local")
        .header("X-Title", "Fun")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau OpenRouter : {e}"))?;

    let status = response.status();
    if !status.is_success() {
        let text = response.text().await.unwrap_or_default();
        return Err(format!("OpenRouter {status}: {text}"));
    }

    let parsed: ChatResponseBody = response
        .json()
        .await
        .map_err(|e| format!("Réponse OpenRouter illisible : {e}"))?;

    parsed
        .choices
        .first()
        .and_then(|c| c.message.content.clone())
        .filter(|c| !c.trim().is_empty())
        .ok_or_else(|| "Réponse vide de l'Assistant.".to_string())
}

pub async fn chat_completion(
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage<'_>>,
) -> Result<String, String> {
    let mut attempt = 0u32;
    loop {
        match chat_completion_once(api_key, model, messages.clone()).await {
            Ok(response) => return Ok(response),
            Err(err) if is_rate_limited(&err) && attempt < MAX_RETRIES => {
                attempt += 1;
                let delay_ms = INITIAL_BACKOFF_MS * 2u64.pow(attempt - 1);
                tokio::time::sleep(Duration::from_millis(delay_ms)).await;
            }
            Err(err) => return Err(err),
        }
    }
}

fn is_rate_limited(err: &str) -> bool {
    err.contains("429") || err.to_lowercase().contains("rate limit")
}

pub fn is_model_not_found(err: &str) -> bool {
    let lower = err.to_lowercase();
    lower.contains("404")
        && (lower.contains("no endpoints found") || lower.contains("not found"))
}

/// Appelle OpenRouter avec repli sur [`DEFAULT_FREE_MODEL`] si le modèle est introuvable.
pub async fn chat_completion_resolved(
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage<'_>>,
) -> Result<String, String> {
    use crate::ai::model::{normalize_free_model, DEFAULT_FREE_MODEL};

    let primary = normalize_free_model(model);
    match chat_completion(api_key, &primary, messages.clone()).await {
        Ok(response) => Ok(response),
        Err(err) if is_model_not_found(&err) && primary != DEFAULT_FREE_MODEL => {
            chat_completion(api_key, DEFAULT_FREE_MODEL, messages).await
        }
        Err(err) => Err(err),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn is_rate_limited_detects_429() {
        assert!(is_rate_limited("OpenRouter 429 Too Many Requests"));
        assert!(is_rate_limited("rate limit exceeded"));
        assert!(!is_rate_limited("OpenRouter 500: internal error"));
    }

    #[test]
    fn is_model_not_found_detects_404() {
        assert!(is_model_not_found(
            r#"OpenRouter 404 Not Found: {"error":{"message":"No endpoints found for google/gemma-2-9b-it:free"}}"#
        ));
        assert!(!is_model_not_found("OpenRouter 500: internal error"));
    }
}
