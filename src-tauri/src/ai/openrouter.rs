pub const OPENROUTER_API_BASE: &str = "https://openrouter.ai/api/v1";

pub fn is_free_model(model_id: &str) -> bool {
    model_id.trim().ends_with(":free")
}

pub fn assert_free_model(model_id: &str) -> Result<(), String> {
    if is_free_model(model_id) {
        Ok(())
    } else {
        Err("Seuls les modèles :free sont éligibles.".to_string())
    }
}

#[cfg(test)]
mod tests {
    use super::{assert_free_model, is_free_model};

    #[test]
    fn is_free_model_checks_suffix() {
        assert!(is_free_model("google/gemma-2-9b-it:free"));
        assert!(!is_free_model("openai/gpt-4o"));
    }

    #[test]
    fn assert_free_model_rejects_paid() {
        assert_free_model("meta/llama:free").expect("ok");
        assert_free_model("meta/llama").expect_err("paid");
    }
}
