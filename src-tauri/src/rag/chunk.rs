use super::types::{Chunk, CHUNK_TARGET_CHARS};

pub fn chunk_document(path: &str, kind: super::types::SourceKind, text: &str) -> Vec<Chunk> {
    let trimmed = text.trim();
    if trimmed.is_empty() {
        return Vec::new();
    }

    let chars: Vec<char> = trimmed.chars().collect();
    if chars.len() <= CHUNK_TARGET_CHARS {
        return vec![Chunk {
            id: format!("{path}#0"),
            path: path.to_string(),
            kind,
            text: trimmed.to_string(),
        }];
    }

    let overlap = CHUNK_TARGET_CHARS / 5;
    let mut chunks = Vec::new();
    let mut start = 0usize;
    let mut idx = 0usize;

    while start < chars.len() {
        let end = (start + CHUNK_TARGET_CHARS).min(chars.len());
        let slice: String = chars[start..end].iter().collect();
        chunks.push(Chunk {
            id: format!("{path}#{idx}"),
            path: path.to_string(),
            kind,
            text: slice,
        });
        if end >= chars.len() {
            break;
        }
        start = end.saturating_sub(overlap);
        idx += 1;
        if idx > 200 {
            break;
        }
    }

    chunks
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rag::types::SourceKind;

    #[test]
    fn chunk_document_splits_long_text() {
        let text = "a".repeat(2_000);
        let chunks = chunk_document("x.md", SourceKind::KnowledgePack, &text);
        assert!(chunks.len() > 1);
        assert!(chunks.iter().all(|c| c.text.chars().count() <= CHUNK_TARGET_CHARS));
    }

    #[test]
    fn chunk_document_skips_empty() {
        assert!(chunk_document("x.md", SourceKind::KnowledgePack, "   ").is_empty());
    }
}
