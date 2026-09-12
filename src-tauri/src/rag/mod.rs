//! RAG lexical local pour ancrer Chat / Trace / Claire dans l'architecture Projet.

mod chunk;
mod index;
mod knowledge;
mod retrieve;
mod scan;
pub(crate) mod types;

pub use index::{get_index_status, rebuild_index};
pub use retrieve::{ensure_index_and_retrieve, format_rag_section};
pub use types::RetrievedChunk;
