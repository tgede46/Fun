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

/// Demande de création ou dessin sur le canvas Excalidraw (pas une question textuelle).
pub fn is_diagram_draw_request(message: &str) -> bool {
    let lower = message.to_lowercase();

    if lower.contains("diagramme")
        || lower.contains("digramme")
        || lower.contains("diagra")
        || lower.contains("dessine")
        || lower.contains("dessiner")
        || lower.contains("flowchart")
        || lower.contains("excalidraw")
        || lower.contains("sur le canvas")
        || lower.contains("dans le canvas")
        || lower.contains("sur le canevas")
    {
        return true;
    }

    let demo = lower.contains("demo") || lower.contains("démo") || lower.contains("demonstration");
    let visual = lower.contains("schema")
        || lower.contains("schéma")
        || lower.contains("flux")
        || lower.contains("flow")
        || lower.contains("boîte")
        || lower.contains("boite");

    demo && (visual || lower.contains("diagram") || lower.contains("digr"))
}

pub fn detect_persona(message: &str) -> Persona {
    let lower = message.to_lowercase();

    if lower.contains("cloche")
        || lower.contains("relis")
        || lower.contains("relecture")
        || lower.contains("imperfection")
        || lower.contains("revois")
        || lower.contains("qu'est-ce qui ne va pas")
        || lower.contains("qu est-ce qui ne va pas")
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
        || lower.contains("crée")
        || lower.contains("cree")
        || lower.contains("génère")
        || lower.contains("genere")
        || is_diagram_draw_request(message)
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
    use super::{detect_persona, is_diagram_draw_request, is_reset_request, Persona};

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

    #[test]
    fn routes_diagram_demo_to_editeur() {
        assert!(is_diagram_draw_request(
            "oui oui un digramme pour me faire une demo"
        ));
        assert_eq!(
            detect_persona("oui oui un digramme pour me faire une demo"),
            Persona::Editeur
        );
    }
}
