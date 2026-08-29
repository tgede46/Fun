use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";
const MAX_FILES: usize = 40;
const MAX_BYTES_PER_FILE: usize = 8_000;
const MAX_TOTAL_BYTES: usize = 48_000;

const SOURCE_EXTENSIONS: &[&str] = &[
    "rs", "ts", "tsx", "js", "jsx", "py", "java", "go", "kt", "cs", "cpp", "c", "h", "rb",
    "php", "swift", "vue", "sql",
];

pub fn scan_project_sources(project_root: &Path) -> Result<String, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let mut files: Vec<(PathBuf, u64)> = Vec::new();
    collect_sources(project_root, project_root, &mut files)?;

    files.sort_by(|a, b| b.1.cmp(&a.1));
    files.truncate(MAX_FILES);

    let mut out = String::new();
    let mut total = 0usize;

    for (path, _) in files {
        if total >= MAX_TOTAL_BYTES {
            break;
        }
        let content = fs::read_to_string(&path).unwrap_or_default();
        let truncated = if content.len() > MAX_BYTES_PER_FILE {
            format!("{}…", &content[..MAX_BYTES_PER_FILE])
        } else {
            content
        };
        total += truncated.len();
        let rel = path
            .strip_prefix(project_root)
            .unwrap_or(&path)
            .to_string_lossy();
        out.push_str(&format!("\n--- {rel} ---\n{truncated}\n"));
    }

    Ok(out)
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

        let size = entry.metadata().map(|m| m.len()).unwrap_or(0);
        out.push((path, size));
    }
    Ok(())
}
