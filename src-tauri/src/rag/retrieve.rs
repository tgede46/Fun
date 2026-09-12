use std::collections::HashMap;
use std::path::Path;

use super::index::load_or_rebuild;
use super::types::{RetrievedChunk, StoredIndex, MAX_RAG_CHARS, MIN_QUERY_TOKENS, TOP_K};

/// Tokenisation simple (minuscules, alphanum + accents basiques via chars alphabétiques).
pub fn tokenize(text: &str) -> Vec<String> {
    let mut tokens = Vec::new();
    let mut current = String::new();
    for ch in text.chars() {
        if ch.is_alphanumeric() {
            current.extend(ch.to_lowercase());
        } else if !current.is_empty() {
            if current.len() > 1 {
                tokens.push(std::mem::take(&mut current));
            } else {
                current.clear();
            }
        }
    }
    if current.len() > 1 {
        tokens.push(current);
    }
    tokens
}

fn score_chunk(query_tokens: &[String], text: &str) -> f64 {
    if query_tokens.is_empty() {
        return 0.0;
    }
    let doc_tokens = tokenize(text);
    if doc_tokens.is_empty() {
        return 0.0;
    }

    let mut tf: HashMap<&str, f64> = HashMap::new();
    let len = doc_tokens.len() as f64;
    for t in &doc_tokens {
        *tf.entry(t.as_str()).or_insert(0.0) += 1.0;
    }

    // BM25 allégé (k1=1.2, b=0.75, avgdl≈80)
    let k1 = 1.2_f64;
    let b = 0.75_f64;
    let avgdl = 80.0_f64;
    let mut score = 0.0;
    for q in query_tokens {
        let freq = *tf.get(q.as_str()).unwrap_or(&0.0);
        if freq <= 0.0 {
            continue;
        }
        let idf = 1.0; // corpus local petit — IDF uniforme MVP
        let denom = freq + k1 * (1.0 - b + b * (len / avgdl));
        score += idf * (freq * (k1 + 1.0)) / denom;
    }
    score
}

pub fn retrieve_for_query(index: &StoredIndex, query: &str, top_k: usize) -> Vec<RetrievedChunk> {
    let query_tokens = tokenize(query);
    if query_tokens.len() < MIN_QUERY_TOKENS {
        return Vec::new();
    }

    let mut scored: Vec<RetrievedChunk> = index
        .chunks
        .iter()
        .filter_map(|chunk| {
            let score = score_chunk(&query_tokens, &chunk.text);
            if score <= 0.0 {
                return None;
            }
            Some(RetrievedChunk {
                path: chunk.path.clone(),
                kind: chunk.kind,
                text: chunk.text.clone(),
                score,
            })
        })
        .collect();

    scored.sort_by(|a, b| {
        b.score
            .partial_cmp(&a.score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    scored.truncate(top_k.max(1));
    scored
}

pub fn format_rag_section(chunks: &[RetrievedChunk]) -> String {
    if chunks.is_empty() {
        return String::new();
    }

    let mut out = String::from(
        "\n\nContexte architecture (extrait Projet + knowledge Fun) :\n",
    );
    let mut used = out.chars().count();

    for chunk in chunks {
        let header = format!("\n--- {} ---\n", chunk.path);
        let header_len = header.chars().count();
        let suffix_budget = 12; // « … [tronqué] »
        let remaining = MAX_RAG_CHARS.saturating_sub(used + header_len + suffix_budget);
        if remaining < 40 {
            break;
        }
        let body: String = chunk.text.chars().take(remaining).collect();
        let truncated = body.chars().count() < chunk.text.chars().count();
        out.push_str(&header);
        out.push_str(&body);
        if truncated {
            out.push_str("\n… [tronqué]");
        }
        out.push('\n');
        used = out.chars().count();
        if used >= MAX_RAG_CHARS {
            break;
        }
    }

    if out.chars().count() > MAX_RAG_CHARS {
        out = out.chars().take(MAX_RAG_CHARS).collect();
    }

    out
}

/// Charge/rebuild l'index puis récupère le top-k. Échec → Vec vide (chat sans RAG).
pub fn ensure_index_and_retrieve(project_root: &Path, query: &str) -> Vec<RetrievedChunk> {
    match load_or_rebuild(project_root) {
        Ok(index) => retrieve_for_query(&index, query, TOP_K),
        Err(e) => {
            eprintln!("[rag] Index indisponible : {e}");
            Vec::new()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::rag::index::rebuild_index;
    use crate::rag::types::{Chunk, IndexManifest, SourceKind, StoredIndex};
    use std::fs;
    use std::path::{Path, PathBuf};
    use std::time::{SystemTime, UNIX_EPOCH};

    fn tmp_project() -> PathBuf {
        let id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = PathBuf::from(format!("/tmp/fun_rag_ret_{id}"));
        fs::create_dir_all(root.join(".fun")).unwrap();
        root
    }

    #[test]
    fn short_query_returns_empty() {
        let index = StoredIndex {
            manifest: IndexManifest {
                schema_version: 1,
                built_at: "now".into(),
                content_hash: "x".into(),
                chunk_count: 1,
            },
            chunks: vec![Chunk {
                id: "1".into(),
                path: "a.md".into(),
                kind: SourceKind::KnowledgePack,
                text: "tauri next webview isolation".into(),
            }],
        };
        assert!(retrieve_for_query(&index, "ok", TOP_K).is_empty());
    }

    #[test]
    fn retrieve_prefers_matching_chunk() {
        let index = StoredIndex {
            manifest: IndexManifest {
                schema_version: 1,
                built_at: "now".into(),
                content_hash: "x".into(),
                chunk_count: 2,
            },
            chunks: vec![
                Chunk {
                    id: "1".into(),
                    path: "noise.md".into(),
                    kind: SourceKind::KnowledgePack,
                    text: "pomodoro timer pause meditation".into(),
                },
                Chunk {
                    id: "2".into(),
                    path: "knowledge/ad-1-webview.md".into(),
                    kind: SourceKind::KnowledgePack,
                    text: "isolation webview tauri openrouter jamais fetch depuis next".into(),
                },
            ],
        };
        let hits = retrieve_for_query(&index, "frontière webview tauri openrouter", TOP_K);
        assert!(!hits.is_empty());
        assert!(hits[0].path.contains("ad-1"));
    }

    #[test]
    fn format_rag_section_caps_chars() {
        let big = "x".repeat(10_000);
        let chunks = vec![RetrievedChunk {
            path: "big.md".into(),
            kind: SourceKind::ProjectSource,
            text: big,
            score: 1.0,
        }];
        let section = format_rag_section(&chunks);
        assert!(section.chars().count() <= MAX_RAG_CHARS);
        assert!(section.contains("Contexte architecture"));
    }

    #[test]
    fn empty_corpus_project_still_has_knowledge() {
        let root = tmp_project();
        let index = rebuild_index(&root).unwrap();
        assert!(!index.chunks.is_empty());
        let hits = retrieve_for_query(
            &index,
            "périmètre projet dossier fun architecture",
            TOP_K,
        );
        assert!(!hits.is_empty());
        assert!(hits.iter().any(|h| h.path.contains("knowledge")));
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn retrieve_respects_top_k() {
        let mut chunks = Vec::new();
        for i in 0..12 {
            chunks.push(Chunk {
                id: format!("{i}"),
                path: format!("k{i}.md"),
                kind: SourceKind::KnowledgePack,
                text: format!("architecture logicielle tauri next frontieres patterns {i}"),
            });
        }
        let index = StoredIndex {
            manifest: IndexManifest {
                schema_version: 1,
                built_at: "now".into(),
                content_hash: "x".into(),
                chunk_count: chunks.len(),
            },
            chunks,
        };
        let hits = retrieve_for_query(&index, "architecture logicielle tauri patterns", TOP_K);
        assert_eq!(hits.len(), TOP_K);
    }

    #[test]
    fn ensure_index_fails_gracefully_on_bad_root() {
        let hits = ensure_index_and_retrieve(
            Path::new("/tmp/fun_rag_missing_dir_xyz"),
            "architecture logicielle tauri",
        );
        assert!(hits.is_empty());
    }

    #[test]
    fn prompt_seam_injects_architecture_section() {
        let root = tmp_project();
        let chunks = ensure_index_and_retrieve(&root, "frontière webview tauri openrouter");
        assert!(!chunks.is_empty());
        let prompt = crate::ai::personas::system_prompt(
            crate::ai::intent::Persona::Assistant,
            None,
            &[],
            false,
            &chunks,
        );
        assert!(prompt.contains("Contexte architecture"));
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn ensure_index_and_retrieve_offline_ok() {
        let root = tmp_project();
        let hits = ensure_index_and_retrieve(&root, "platform boundary tauri next containers");
        assert!(root.join(".fun/rag/index.json").exists());
        assert!(!hits.is_empty());
        let _ = fs::remove_dir_all(&root);
    }
}
