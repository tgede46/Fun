#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Persona {
    Relecteur,
    Editeur,
    Assistant,
}

pub fn is_reset_request(message: &str) -> bool {
    let lower = message.to_lowercase();
    lower.contains("repartir de zéro")
        || lower.contains("repartir de zero")
        || lower == "reset"
        || lower.contains("efface tout")
        || lower.contains("vider le canvas")
        || lower.contains("diagramme vide")
}

pub fn detect_persona(message: &str) -> Persona {
    let lower = message.to_lowercase();

    if lower.contains("cloche")
        || lower.contains("relis")
        || lower.contains("relecture")
        || lower.contains("imperfection")
        || lower.contains("revois")
        || lower.contains("qu'est-ce qui ne va pas")
    {
        return Persona::Relecteur;
    }

    if lower.contains("ajoute")
        || lower.contains("modifie")
        || lower.contains("déplace")
        || lower.contains("deplace")
        || lower.contains("supprime")
        || lower.contains("colorie")
        || lower.contains("connecte")
        || lower.contains("rename")
        || lower.contains("renomme")
    {
        return Persona::Editeur;
    }

    Persona::Assistant
}

impl Persona {
    pub fn as_str(&self) -> &'static str {
        match self {
            Persona::Relecteur => "relecteur-diagramme",
            Persona::Editeur => "editeur-canvas",
            Persona::Assistant => "assistant",
        }
    }

    pub fn display_name(&self) -> &'static str {
        match self {
            Persona::Relecteur => "Claire",
            Persona::Editeur => "Trace",
            Persona::Assistant => "Assistant",
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{detect_persona, is_reset_request, Persona};

    #[test]
    fn detects_reset_phrases() {
        assert!(is_reset_request("repartir de zéro"));
        assert!(!is_reset_request("ajoute une boîte"));
    }

    #[test]
    fn routes_review_intent() {
        assert_eq!(detect_persona("qu'est-ce qui cloche ?"), Persona::Relecteur);
    }

    #[test]
    fn routes_edit_intent() {
        assert_eq!(detect_persona("ajoute une boîte API"), Persona::Editeur);
    }
}
