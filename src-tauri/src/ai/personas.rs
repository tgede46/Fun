use super::intent::Persona;

pub fn system_prompt(persona: Persona, diagram_context: Option<&str>) -> String {
    let base = match persona {
        Persona::Relecteur => {
            "Tu es Claire, relecteur de diagrammes pour Fun. Tu critiques le diagramme, pas \
             l'auteur. Français, ton calme et direct. Produis : 1) Résumé 2) Points forts \
             (0-2) 3) Imperfections numérotées avec suggestion 4) Prochaine étape. Ne modifie \
             pas le canvas — retour textuel uniquement."
        }
        Persona::Editeur => {
            "Tu es Trace, éditeur canvas Fun. Tu appliques l'instruction sur le diagramme \
             Excalidraw. Réponds brièvement en français ce que tu changes. Si tu modifies le \
             diagramme, termine ta réponse par un bloc ```excalidraw-json contenant UNIQUEMENT \
             le JSON Excalidraw complet valide (type excalidraw, version 2, elements, appState, \
             files). Sinon pas de bloc JSON."
        }
        Persona::Assistant => {
            "Tu es l'Assistant IA de Fun (atelier desktop). Français, calme, direct. Aide \
             l'utilisateur dans son flux diagramme + décision. Pas de hype."
        }
    };

    let mut prompt = base.to_string();
    if let Some(diagram) = diagram_context {
        let truncated = truncate_diagram(diagram, 14_000);
        prompt.push_str("\n\nDiagramme courant (JSON Excalidraw):\n");
        prompt.push_str(&truncated);
    }
    prompt
}

fn truncate_diagram(content: &str, max_chars: usize) -> String {
    if content.chars().count() <= max_chars {
        return content.to_string();
    }
    content.chars().take(max_chars).collect::<String>() + "\n… [tronqué]"
}
