const KEYRING_SERVICE: &str = "fun-desktop";
const KEYRING_USER: &str = "openrouter-api-key";

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

pub fn store_api_key(api_key: &str) -> Result<(), String> {
    validate_api_key(api_key)?;
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Stockage sécurisé indisponible: {e}"))?;
    entry
        .set_password(api_key.trim())
        .map_err(|e| format!("Impossible d'enregistrer la clé: {e}"))
}

pub fn load_api_key() -> Result<Option<String>, String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Stockage sécurisé indisponible: {e}"))?;
    match entry.get_password() {
        Ok(value) => Ok(Some(value)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(err) => Err(format!("Impossible de lire la clé: {err}")),
    }
}

pub fn has_api_key() -> Result<bool, String> {
    Ok(load_api_key()?.is_some())
}

pub fn delete_api_key() -> Result<(), String> {
    let entry = keyring::Entry::new(KEYRING_SERVICE, KEYRING_USER)
        .map_err(|e| format!("Stockage sécurisé indisponible: {e}"))?;
    match entry.delete_credential() {
        Ok(()) | Err(keyring::Error::NoEntry) => Ok(()),
        Err(err) => Err(format!("Impossible de supprimer la clé: {err}")),
    }
}

#[cfg(test)]
mod tests {
    use super::validate_api_key;

    #[test]
    fn validate_api_key_accepts_sk_or_prefix() {
        validate_api_key("sk-or-v1-test").expect("valid");
    }

    #[test]
    fn validate_api_key_rejects_invalid_prefix() {
        validate_api_key("sk-test").expect_err("invalid");
    }
}
