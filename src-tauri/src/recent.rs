use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};
use std::time::SystemTime;
use tauri::{AppHandle, Manager};

const MAX_RECENTS: usize = 10;
const STORE_FILE: &str = "recent_projects.json";

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentProject {
    pub path: String,
    pub name: String,
    pub last_opened: String,
}

#[derive(Debug, Default, Serialize, Deserialize)]
struct RecentStore {
    projects: Vec<RecentProject>,
}

fn store_path(app: &AppHandle) -> Result<PathBuf, String> {
    app.path()
        .app_data_dir()
        .map_err(|e| e.to_string())
        .map(|dir| dir.join(STORE_FILE))
}

fn read_store(path: &Path) -> RecentStore {
    if !path.exists() {
        return RecentStore::default();
    }

    fs::read_to_string(path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

/// Canonicalize a path safely: returns the original unmodified path string if
/// canonicalization fails (file missing, permission denied, etc.).
fn canonicalize_safe(raw: &str) -> PathBuf {
    let candidate = PathBuf::from(raw);
    if candidate.is_dir() {
        fs::canonicalize(&candidate).unwrap_or_else(|_| candidate.clone())
    } else {
        candidate.clone()
    }
}

fn write_store(path: &Path, store: &RecentStore) -> Result<(), String> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let raw = serde_json::to_string_pretty(store).map_err(|e| e.to_string())?;

    // Atomic write: write to a temp file then rename. On Linux/macOS, rename
    // is atomic when source and destination are on the same filesystem.
    let tmp_path = path.with_file_name(format!(".{}.tmp", STORE_FILE));
    fs::write(&tmp_path, &raw).map_err(|e| e.to_string())?;
    fs::rename(&tmp_path, path).map_err(|e| {
        let _ = fs::remove_file(&tmp_path);
        e.to_string()
    })
}

fn project_name(path: &Path) -> String {
    path.file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.is_empty())
        .unwrap_or("Projet")
        .to_string()
}

fn iso_timestamp() -> String {
    let now = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .unwrap_or_default()
        .as_secs();
    format!("{now}")
}

pub fn list_recent_projects(app: AppHandle) -> Result<Vec<RecentProject>, String> {
    let path = store_path(&app)?;
    let mut store = read_store(&path);
    let before = store.projects.len();
    store
        .projects
        .retain(|project| Path::new(&project.path).is_dir());
    store.projects.sort_by(|a, b| b.last_opened.cmp(&a.last_opened));

    if store.projects.len() != before {
        if let Err(e) = write_store(&path, &store) {
            eprintln!("Warning: failed to persist filtered recents: {e}");
        }
    }

    Ok(store.projects)
}

pub fn touch_recent_project(app: AppHandle, project_path: String) -> Result<RecentProject, String> {
    let path_buf = PathBuf::from(&project_path);
    if !path_buf.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    // Canonicalize the incoming path to normalize symlinks and spellings.
    let canonical = canonicalize_safe(&project_path);

    let entry = RecentProject {
        path: canonical.to_string_lossy().into_owned(),
        name: project_name(&canonical),
        last_opened: iso_timestamp(),
    };

    let store_path = store_path(&app)?;
    let mut store = read_store(&store_path);

    // Deduplicate: remove any existing entry whose canonical path matches.
    // Canonicalize existing entries to handle pre-canonicalization store data.
    store.projects.retain(|p| {
        let existing = canonicalize_safe(&p.path);
        existing != canonical && PathBuf::from(&p.path) != PathBuf::from(&project_path)
    });
    store.projects.insert(0, entry.clone());

    if store.projects.len() > MAX_RECENTS {
        store.projects.truncate(MAX_RECENTS);
    }

    write_store(&store_path, &store)?;
    Ok(entry)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::os::unix::fs::PermissionsExt;
    use tempfile::TempDir;

    #[test]
    fn canonicalize_safe_normalises_symlink() {
        let tmp = TempDir::new().unwrap();
        let target = tmp.path().join("real");
        fs::create_dir_all(&target).unwrap();
        let link = tmp.path().join("link");
        std::os::unix::fs::symlink(&target, &link).unwrap();

        let result = canonicalize_safe(link.to_string_lossy().as_ref());
        assert_eq!(result, fs::canonicalize(&target).unwrap());
    }

    #[test]
    fn canonicalize_safe_returns_original_when_dir_missing() {
        let missing = "/tmp/fun_test_nonexistent_dir_12345";
        let result = canonicalize_safe(missing);
        assert_eq!(result, PathBuf::from(missing));
    }

    #[test]
    fn canonicalize_safe_handles_regular_path() {
        let tmp = TempDir::new().unwrap();
        let result = canonicalize_safe(tmp.path().to_str().unwrap());
        assert_eq!(result, fs::canonicalize(tmp.path()).unwrap());
    }

    #[test]
    fn write_store_read_store_roundtrip() {
        let tmp = TempDir::new().unwrap();
        let store_path = tmp.path().join(STORE_FILE);

        let store = RecentStore {
            projects: vec![
                RecentProject { path: "/tmp/a".into(), name: "a".into(), last_opened: "1000".into() },
                RecentProject { path: "/tmp/b".into(), name: "b".into(), last_opened: "2000".into() },
            ],
        };
        write_store(&store_path, &store).unwrap();
        let loaded = read_store(&store_path);

        assert_eq!(loaded.projects.len(), 2);
        assert_eq!(loaded.projects[0].path, "/tmp/a");
        assert_eq!(loaded.projects[1].name, "b");
    }

    #[test]
    fn write_store_atomic_preserves_old_data_on_failure() {
        let tmp = TempDir::new().unwrap();
        let store_path = tmp.path().join(STORE_FILE);

        let original = RecentStore {
            projects: vec![RecentProject {
                path: "/tmp/original".into(),
                name: "original".into(),
                last_opened: "1000".into(),
            }],
        };
        write_store(&store_path, &original).unwrap();

        // Make the parent dir read-only so write_store fails before rename
        let parent = store_path.parent().unwrap();
        let orig_perms = fs::metadata(parent).unwrap().permissions();
        fs::set_permissions(parent, fs::Permissions::from_mode(0o555)).unwrap();

        let corrupted = RecentStore {
            projects: vec![RecentProject {
                path: "/tmp/corrupted".into(),
                name: "corrupted".into(),
                last_opened: "2000".into(),
            }],
        };
        let result = write_store(&store_path, &corrupted);
        assert!(result.is_err(), "write should fail on read-only dir");

        // Restore permissions and verify original is intact
        fs::set_permissions(parent, orig_perms).unwrap();
        let survived = read_store(&store_path);
        assert_eq!(survived.projects.len(), 1);
        assert_eq!(survived.projects[0].path, "/tmp/original");
    }

    #[test]
    fn write_store_survives_partial_temp_file() {
        let tmp = TempDir::new().unwrap();
        let store_path = tmp.path().join(STORE_FILE);

        let original = RecentStore {
            projects: vec![RecentProject {
                path: "/tmp/original".into(),
                name: "original".into(),
                last_opened: "1000".into(),
            }],
        };
        write_store(&store_path, &original).unwrap();

        // Simulate crash: write partial/truncated content to the temp file
        let tmp_path = store_path.with_file_name(format!(".{}.tmp", STORE_FILE));
        fs::write(&tmp_path, "{\"type\":\"partial\"").unwrap();

        // read_store should still return the original, not the partial tmp
        let survived = read_store(&store_path);
        assert_eq!(survived.projects.len(), 1);
        assert_eq!(survived.projects[0].path, "/tmp/original");

        // Cleanup
        let _ = fs::remove_file(&tmp_path);
    }

    #[test]
    fn dedup_removes_existing_canonical_match() {
        let tmp = TempDir::new().unwrap();
        let target = tmp.path().join("real");
        fs::create_dir_all(&target).unwrap();
        let link = tmp.path().join("link");
        std::os::unix::fs::symlink(&target, &link).unwrap();

        let canonical = fs::canonicalize(&target).unwrap();
        let mut projects = vec![
            RecentProject { path: target.to_string_lossy().into_owned(), name: "p".into(), last_opened: "1".into() },
            RecentProject { path: link.to_string_lossy().into_owned(), name: "p".into(), last_opened: "2".into() },
        ];
        projects.retain(|p| {
            let existing = canonicalize_safe(&p.path);
            existing != canonical && PathBuf::from(&p.path) != PathBuf::from(link.to_string_lossy().as_ref())
        });
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].path, target.to_string_lossy());
    }

    #[test]
    fn dedup_keeps_non_matching_entries() {
        let tmp = TempDir::new().unwrap();
        let proj_a = tmp.path().join("projet-a");
        let proj_b = tmp.path().join("projet-b");
        fs::create_dir_all(&proj_a).unwrap();
        fs::create_dir_all(&proj_b).unwrap();

        let canonical_a = fs::canonicalize(&proj_a).unwrap();
        let mut projects = vec![
            RecentProject { path: proj_b.to_string_lossy().into_owned(), name: "b".into(), last_opened: "1".into() },
        ];
        projects.retain(|p| {
            let existing = canonicalize_safe(&p.path);
            existing != canonical_a && PathBuf::from(&p.path) != PathBuf::from(proj_a.to_string_lossy().as_ref())
        });
        assert_eq!(projects.len(), 1);
        assert_eq!(projects[0].path, proj_b.to_string_lossy());
    }

    #[test]
    fn read_store_returns_default_on_missing_file() {
        let tmp = TempDir::new().unwrap();
        let store_file = tmp.path().join(STORE_FILE);
        let store = read_store(&store_file);
        assert!(store.projects.is_empty());
    }

    #[test]
    fn read_store_returns_default_on_corrupt_json() {
        let tmp = TempDir::new().unwrap();
        let store_file = tmp.path().join(STORE_FILE);
        fs::write(&store_file, "{invalid json!!!").unwrap();
        let store = read_store(&store_file);
        assert!(store.projects.is_empty());
    }
}
