use super::intent::Persona;
use crate::rag::RetrievedChunk;

pub fn system_prompt(
    persona: Persona,
    diagram_context: Option<&str>,
    selected_diagrams: &[String],
    plantuml_mode: bool,
    architecture_chunks: &[RetrievedChunk],
) -> String {
    let base = match persona {
        Persona::Relecteur => {
            "Tu es Claire, relecteur de diagrammes pour Fun. Tu critiques le diagramme, pas \
             l'auteur. Français, ton calme et direct. Produis : 1) Résumé 2) Points forts \
             (0-2) 3) Imperfections numérotées avec suggestion 4) Prochaine étape. Ne modifie \
             pas le canvas — retour textuel uniquement. Ancre tes remarques dans l'architecture \
             logicielle (C4, frontières, patterns) quand le contexte le permet."
        }
        Persona::Editeur if plantuml_mode => {
            "Tu es Trace, éditeur canvas Fun en mode PlantUML. Applique l'instruction sur le \
             diagramme. Réponds brièvement en français ce que tu changes. Tu DOIS terminer par \
             un bloc ```plantuml contenant UNIQUEMENT le source PlantUML complet (@startuml … \
             @enduml). Pas de Mermaid, pas de JSON Excalidraw."
        }
        Persona::Editeur => {
            "Tu es Trace, éditeur canvas Fun. Tu dessines UNIQUEMENT en JSON Excalidraw (pas Mermaid, \
             pas PlantUML, pas d'ASCII). Applique l'instruction sur le diagramme. Réponds brièvement en \
             français ce que tu changes. Tu DOIS terminer par un bloc ```excalidraw-json contenant \
             UNIQUEMENT le JSON Excalidraw complet valide (type excalidraw, version 2, elements, \
             appState, files). Chaque élément doit avoir id, type, x, y, width, height. Types autorisés \
             uniquement : rectangle, ellipse (pas circle), diamond, arrow, line, text. Les arrow/line \
             DOIVENT avoir points: [[0,0],[dx,dy]]. Si le canvas est vide, crée un diagramme complet \
             from scratch."
        }
        Persona::Assistant => {
            "Tu es l'Assistant IA de Fun (atelier desktop Excalidraw). Français, calme, direct. \
             Spécialisé en architecture logicielle : C4, ADR, frontières plateforme, patterns. \
             Fun ne supporte PAS Mermaid : les diagrammes visuels passent par Trace sur le canvas. \
             Si l'utilisateur veut un diagramme dessiné, dis-lui d'ouvrir un diagramme (Nouveau \
             diagramme) puis de demander par ex. « Crée un diagramme de démo avec… » — Trace dessinera \
             sur le canvas. Réponds en texte seulement, sans bloc Mermaid."
        }
    };

    let mut prompt = base.to_string();

    // RAG lexical — après persona, avant diagrammes (contrat Trace prioritaire en tête)
    if !architecture_chunks.is_empty() {
        prompt.push_str(&crate::rag::format_rag_section(architecture_chunks));
    }

    // Contexte multi-diagrammes (sélection multiple)
    if !selected_diagrams.is_empty() {
        prompt.push_str("\n\nDiagrammes sélectionnés par l'utilisateur (JSON Excalidraw):\n");
        for (i, content) in selected_diagrams.iter().enumerate() {
            let truncated = truncate_diagram(content, 8_000);
            prompt.push_str(&format!("\n--- Diagramme {} ---\n{}\n", i + 1, truncated));
        }
    }

    // Diagramme actif
    if let Some(diagram) = diagram_context {
        let truncated = truncate_diagram(diagram, 14_000);
        if plantuml_mode {
            prompt.push_str("\n\nDiagramme courant (PlantUML):\n");
        } else {
            prompt.push_str("\n\nDiagramme courant (JSON Excalidraw):\n");
        }
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

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rag::types::SourceKind;
    use crate::rag::RetrievedChunk;
    use crate::ai::intent::Persona;

    #[test]
    fn trace_keeps_format_before_rag() {
        let chunks = [RetrievedChunk {
            path: "knowledge/ad-1-webview.md".into(),
            kind: SourceKind::KnowledgePack,
            text: "isolation webview tauri".into(),
            score: 1.0,
        }];
        let prompt = system_prompt(Persona::Editeur, None, &[], false, &chunks);
        let format_pos = prompt.find("```excalidraw-json").expect("format");
        let rag_pos = prompt.find("Contexte architecture").expect("rag");
        assert!(format_pos < rag_pos);
    }
}
