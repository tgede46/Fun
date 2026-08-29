use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
struct ChatRequest<'a> {
    model: &'a str,
    messages: Vec<ChatMessage<'a>>,
}

#[derive(Debug, Serialize, Clone)]
pub struct ChatMessage<'a> {
    pub role: &'a str,
    pub content: &'a str,
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

pub async fn chat_completion(
    api_key: &str,
    model: &str,
    messages: Vec<ChatMessage<'_>>,
) -> Result<String, String> {
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(120))
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

    if !response.status().is_success() {
        let status = response.status();
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
