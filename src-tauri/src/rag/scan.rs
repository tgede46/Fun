use std::fs;
use std::path::{Path, PathBuf};

use super::knowledge::{bundled_knowledge, knowledge_kind};
use super::types::SourceKind;

const FUN_DIR: &str = ".fun";
const MAX_SOURCE_FILES: usize = 40;
const MAX_BYTES_PER_FILE: usize = 8_000;

const SOURCE_EXTENSIONS: &[&str] = &[
    "rs", "ts", "tsx", "js", "jsx", "py", "java", "go", "kt", "cs", "cpp", "c", "h", "rb",
    "php", "swift", "vue", "sql", "md", "json", "toml",
];

#[derive(Debug, Clone)]
pub struct ScannedDoc {
    pub path: String,
    pub kind: SourceKind,
    pub text: String,
    pub mtime_secs: u64,
}

/// Collecte sources Projet + artefacts `.fun/` + knowledge pack (+ overlay utilisateur).
pub fn collect_corpus(project_root: &Path) -> Result<Vec<ScannedDoc>, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let mut docs = Vec::new();

    // Knowledge pack embarqué (mtime fixe = 0)
    for doc in bundled_knowledge() {
        docs.push(ScannedDoc {
            path: doc.path.to_string(),
            kind: knowledge_kind(),
            text: truncate_bytes(doc.body, MAX_BYTES_PER_FILE),
            mtime_secs: 0,
        });
    }

    // Overlay `.fun/knowledge/`
    let user_knowledge = project_root.join(FUN_DIR).join("knowledge");
    if user_knowledge.is_dir() {
        collect_tree(
            project_root,
            &user_knowledge,
            SourceKind::UserKnowledge,
            &mut docs,
            true,
        )?;
    }

    // Artefacts `.fun/` (diagrammes, settings, ai) — pas le cache rag
    let fun_path = project_root.join(FUN_DIR);
    if fun_path.is_dir() {
        collect_fun_artifacts(project_root, &fun_path, &mut docs)?;
    }

    // Sources Projet (hors .fun, node_modules, target, dot-dirs)
    let mut sources: Vec<(PathBuf, u64)> = Vec::new();
    collect_sources(project_root, project_root, &mut sources)?;
    sources.sort_by(|a, b| b.1.cmp(&a.1));
    sources.truncate(MAX_SOURCE_FILES);

    for (path, _) in sources {
        let meta = fs::metadata(&path).ok();
        let mtime = meta
            .as_ref()
            .and_then(|m| m.modified().ok())
            .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
            .map(|d| d.as_secs())
            .unwrap_or(0);
        let content = fs::read_to_string(&path).unwrap_or_default();
        let rel = path
            .strip_prefix(project_root)
            .unwrap_or(&path)
            .to_string_lossy()
            .replace('\\', "/");
        docs.push(ScannedDoc {
            path: rel,
            kind: SourceKind::ProjectSource,
            text: truncate_bytes(&content, MAX_BYTES_PER_FILE),
            mtime_secs: mtime,
        });
    }

    Ok(docs)
}

pub fn corpus_content_hash(docs: &[ScannedDoc]) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    let mut hasher = DefaultHasher::new();
    for doc in docs {
        doc.path.hash(&mut hasher);
        doc.kind.as_str().hash(&mut hasher);
        doc.mtime_secs.hash(&mut hasher);
        doc.text.len().hash(&mut hasher);
        // Échantillon pour détecter changements sans hasher tout le texte
        let sample: String = doc.text.chars().take(64).collect();
        sample.hash(&mut hasher);
    }
    format!("{:x}", hasher.finish())
}

fn truncate_bytes(content: &str, max: usize) -> String {
    if content.len() <= max {
        return content.to_string();
    }
    // Couper sur frontière char
    let mut end = max;
    while end > 0 && !content.is_char_boundary(end) {
        end -= 1;
    }
    format!("{}…", &content[..end])
}

fn collect_fun_artifacts(
    project_root: &Path,
    fun_path: &Path,
    out: &mut Vec<ScannedDoc>,
) -> Result<(), String> {
    for entry in fs::read_dir(fun_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if name == "rag" || name == "knowledge" {
            continue;
        }
        if path.is_dir() {
            collect_tree(project_root, &path, SourceKind::FunArtifact, out, false)?;
        } else if matches!(
            path.extension().and_then(|e| e.to_str()),
            Some("json" | "excalidraw" | "md" | "puml" | "drawio")
        ) {
            push_file(project_root, &path, SourceKind::FunArtifact, out);
        }
    }
    Ok(())
}

fn collect_tree(
    project_root: &Path,
    dir: &Path,
    kind: SourceKind,
    out: &mut Vec<ScannedDoc>,
    markdown_only: bool,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();
        if path.is_dir() {
            if name.starts_with('.') {
                continue;
            }
            collect_tree(project_root, &path, kind, out, markdown_only)?;
            continue;
        }
        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if markdown_only && ext != "md" {
            continue;
        }
        if !markdown_only
            && !matches!(
                ext,
                "json" | "excalidraw" | "md" | "puml" | "drawio" | "txt"
            )
        {
            continue;
        }
        push_file(project_root, &path, kind, out);
    }
    Ok(())
}

fn push_file(project_root: &Path, path: &Path, kind: SourceKind, out: &mut Vec<ScannedDoc>) {
    let meta = fs::metadata(path).ok();
    let mtime = meta
        .as_ref()
        .and_then(|m| m.modified().ok())
        .and_then(|t| t.duration_since(std::time::UNIX_EPOCH).ok())
        .map(|d| d.as_secs())
        .unwrap_or(0);
    let content = fs::read_to_string(path).unwrap_or_default();
    if content.trim().is_empty() {
        return;
    }
    let rel = path
        .strip_prefix(project_root)
        .unwrap_or(path)
        .to_string_lossy()
        .replace('\\', "/");
    out.push(ScannedDoc {
        path: rel,
        kind,
        text: truncate_bytes(&content, MAX_BYTES_PER_FILE),
        mtime_secs: mtime,
    });
}

fn collect_sources(
    project_root: &Path,
    dir: &Path,
    out: &mut Vec<(PathBuf, u64)>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let name = entry.file_name().to_string_lossy().to_string();

        if path.is_dir() {
            if name == FUN_DIR || name.starts_with('.') || name == "node_modules" || name == "target"
            {
                continue;
            }
            collect_sources(project_root, &path, out)?;
            continue;
        }

        let ext = path.extension().and_then(|e| e.to_str()).unwrap_or("");
        if !SOURCE_EXTENSIONS.contains(&ext) {
            continue;
        }
        // md/json/toml projet hors .fun : utile pour ADR utilisateur à la racine
        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push((path, size));
    }
    Ok(())
}
