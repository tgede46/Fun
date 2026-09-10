use serde::{Deserialize, Serialize};

pub const TOP_K: usize = 5;
pub const MAX_RAG_CHARS: usize = 6_000;
pub const MIN_QUERY_TOKENS: usize = 3;
pub const CHUNK_TARGET_CHARS: usize = 800;
pub const SCHEMA_VERSION: u32 = 1;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum SourceKind {
    ProjectSource,
    FunArtifact,
    KnowledgePack,
    UserKnowledge,
}

impl SourceKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::ProjectSource => "project_source",
            Self::FunArtifact => "fun_artifact",
            Self::KnowledgePack => "knowledge_pack",
            Self::UserKnowledge => "user_knowledge",
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Chunk {
    pub id: String,
    pub path: String,
    pub kind: SourceKind,
    pub text: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct RetrievedChunk {
    pub path: String,
    pub kind: SourceKind,
    pub text: String,
    pub score: f64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct IndexManifest {
    pub schema_version: u32,
    pub built_at: String,
    pub content_hash: String,
    pub chunk_count: usize,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct StoredIndex {
    pub manifest: IndexManifest,
    pub chunks: Vec<Chunk>,
}
