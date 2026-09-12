//! Knowledge pack Fun embarqué (C4, AD, patterns).

use super::types::SourceKind;

pub struct KnowledgeDoc {
    pub path: &'static str,
    pub body: &'static str,
}

pub fn bundled_knowledge() -> &'static [KnowledgeDoc] {
    &[
        KnowledgeDoc {
            path: "knowledge/ad-1-webview.md",
            body: include_str!("../../resources/knowledge/ad-1-webview.md"),
        },
        KnowledgeDoc {
            path: "knowledge/ad-4-projet-fun.md",
            body: include_str!("../../resources/knowledge/ad-4-projet-fun.md"),
        },
        KnowledgeDoc {
            path: "knowledge/c4-containers.md",
            body: include_str!("../../resources/knowledge/c4-containers.md"),
        },
        KnowledgeDoc {
            path: "knowledge/patterns-platform-boundary.md",
            body: include_str!("../../resources/knowledge/patterns-platform-boundary.md"),
        },
        KnowledgeDoc {
            path: "knowledge/patterns-hexagonal.md",
            body: include_str!("../../resources/knowledge/patterns-hexagonal.md"),
        },
        KnowledgeDoc {
            path: "knowledge/patterns-c4-adr.md",
            body: include_str!("../../resources/knowledge/patterns-c4-adr.md"),
        },
    ]
}

pub fn knowledge_kind() -> SourceKind {
    SourceKind::KnowledgePack
}
