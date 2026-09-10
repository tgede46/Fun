use chrono::Utc;
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};

use super::chunk::chunk_document;
use super::scan::{collect_corpus, corpus_content_hash};
use super::types::{IndexManifest, StoredIndex, SCHEMA_VERSION};

const FUN_DIR: &str = ".fun";
const RAG_DIR: &str = "rag";
const INDEX_FILE: &str = "index.json";

#[derive(Debug, Clone, Serialize)]
pub struct RagIndexStatus {
    pub built_at: String,
    pub stale: bool,
    pub chunk_count: usize,
    pub sources_indexed: usize,
}

fn rag_dir(project_root: &Path) -> PathBuf {
    project_root.join(FUN_DIR).join(RAG_DIR)
}

fn index_path(project_root: &Path) -> PathBuf {
    rag_dir(project_root).join(INDEX_FILE)
}

pub fn read_stored_index(project_root: &Path) -> Option<StoredIndex> {
    let path = index_path(project_root);
    let raw = fs::read_to_string(path).ok()?;
    serde_json::from_str(&raw).ok()
}

pub fn write_stored_index(project_root: &Path, index: &StoredIndex) -> Result<(), String> {
    let dir = rag_dir(project_root);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let path = index_path(project_root);
    let pretty = serde_json::to_string_pretty(index).map_err(|e| e.to_string())?;
    fs::write(path, pretty).map_err(|e| e.to_string())
}

pub fn is_index_stale(project_root: &Path, stored: &StoredIndex) -> bool {
    if stored.manifest.schema_version != SCHEMA_VERSION {
        return true;
    }
    match collect_corpus(project_root) {
        Ok(docs) => corpus_content_hash(&docs) != stored.manifest.content_hash,
        Err(_) => true,
    }
}

pub fn rebuild_index(project_root: &Path) -> Result<StoredIndex, String> {
    let docs = collect_corpus(project_root)?;
    let content_hash = corpus_content_hash(&docs);
    let sources_indexed = docs.len();

    let mut chunks = Vec::new();
    for doc in &docs {
        chunks.extend(chunk_document(&doc.path, doc.kind, &doc.text));
    }

    let index = StoredIndex {
        manifest: IndexManifest {
            schema_version: SCHEMA_VERSION,
            built_at: Utc::now().to_rfc3339(),
            content_hash,
            chunk_count: chunks.len(),
        },
        chunks,
    };

    write_stored_index(project_root, &index)?;
    let _ = sources_indexed;
    Ok(index)
}

pub fn load_or_rebuild(project_root: &Path) -> Result<StoredIndex, String> {
    if let Some(stored) = read_stored_index(project_root) {
        if !is_index_stale(project_root, &stored) {
            return Ok(stored);
        }
    }
    rebuild_index(project_root)
}

pub fn get_index_status(project_root: &Path) -> Result<RagIndexStatus, String> {
    let docs_count = collect_corpus(project_root).map(|d| d.len()).unwrap_or(0);
    match read_stored_index(project_root) {
        Some(stored) => {
            let stale = is_index_stale(project_root, &stored);
            Ok(RagIndexStatus {
                built_at: stored.manifest.built_at,
                stale,
                chunk_count: stored.manifest.chunk_count,
                sources_indexed: docs_count,
            })
        }
        None => Ok(RagIndexStatus {
            built_at: String::new(),
            stale: true,
            chunk_count: 0,
            sources_indexed: docs_count,
        }),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn tmp_project() -> PathBuf {
        let id = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .unwrap()
            .as_nanos();
        let root = PathBuf::from(format!("/tmp/fun_rag_idx_{id}"));
        fs::create_dir_all(root.join(".fun")).unwrap();
        root
    }

    #[test]
    fn rebuild_index_creates_fun_rag() {
        let root = tmp_project();
        let index = rebuild_index(&root).unwrap();
        assert!(index.manifest.chunk_count > 0);
        assert!(index_path(&root).exists());
        let _ = fs::remove_dir_all(&root);
    }

    #[test]
    fn load_or_rebuild_fresh_after_build() {
        let root = tmp_project();
        let first = rebuild_index(&root).unwrap();
        let second = load_or_rebuild(&root).unwrap();
        assert_eq!(first.manifest.content_hash, second.manifest.content_hash);
        let _ = fs::remove_dir_all(&root);
    }
}
