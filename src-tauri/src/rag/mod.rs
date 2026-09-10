//! RAG lexical local pour ancrer Chat / Trace / Claire dans l'architecture Projet.

mod chunk;
mod index;
mod knowledge;
mod retrieve;
mod scan;
mod types;

pub use index::{get_index_status, rebuild_index, RagIndexStatus};
pub use retrieve::{ensure_index_and_retrieve, format_rag_section};
pub use types::{RetrievedChunk, SourceKind};
