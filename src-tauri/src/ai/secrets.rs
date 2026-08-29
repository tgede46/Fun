const ENV_API_KEY: &str = "OPENROUTER_API_KEY";

pub fn validate_api_key(api_key: &str) -> Result<(), String> {
    let trimmed = api_key.trim();
    if trimmed.is_empty() {
        return Err("La clé OpenRouter est requise.".to_string());
    }
    if !trimmed.starts_with("sk-or-") {
        return Err("La clé doit commencer par sk-or-.".to_string());
    }
    Ok(())
}

pub fn load_api_key() -> Result<Option<String>, String> {
    match std::env::var(ENV_API_KEY) {
        Ok(value) => {
            let trimmed = value.trim();
            if trimmed.is_empty() {
                Ok(None)
            } else {
                validate_api_key(trimmed)?;
                Ok(Some(trimmed.to_string()))
            }
        }
        Err(std::env::VarError::NotPresent) => Ok(None),
        Err(err) => Err(format!("Impossible de lire {ENV_API_KEY}: {err}")),
    }
}

pub fn has_api_key() -> Result<bool, String> {
    Ok(load_api_key()?.is_some())
}

#[cfg(test)]
mod tests {
    use super::{has_api_key, validate_api_key};
    use std::sync::{Mutex, MutexGuard};

    static ENV_LOCK: Mutex<()> = Mutex::new(());

    fn env_test_guard() -> MutexGuard<'static, ()> {
        ENV_LOCK.lock().unwrap_or_else(|e| e.into_inner())
    }

    #[test]
    fn validate_api_key_accepts_sk_or_prefix() {
        validate_api_key("sk-or-v1-test").expect("valid");
    }

    #[test]
    fn validate_api_key_rejects_invalid_prefix() {
        validate_api_key("sk-test").expect_err("invalid");
    }

    #[test]
    fn load_api_key_reads_env_variable() {
        let _guard = env_test_guard();
        std::env::set_var("OPENROUTER_API_KEY", "sk-or-v1-test");
        assert!(has_api_key().expect("check"));
        std::env::remove_var("OPENROUTER_API_KEY");
    }
}
