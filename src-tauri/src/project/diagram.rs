use chrono::Local;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";
const DIAGRAMS_DIR: &str = "diagrams";

#[derive(Debug, Serialize, Deserialize)]
struct ExcalidrawFile {
    #[serde(rename = "type")]
    doc_type: String,
    version: u32,
    source: String,
    elements: Vec<serde_json::Value>,
    #[serde(rename = "appState")]
    app_state: serde_json::Value,
    files: serde_json::Value,
}

pub fn empty_excalidraw_json() -> Result<String, String> {
    let payload = ExcalidrawFile {
        doc_type: "excalidraw".to_string(),
        version: 2,
        source: "https://excalidraw.com".to_string(),
        elements: Vec::new(),
        app_state: serde_json::json!({
            "gridSize": null,
            "viewBackgroundColor": "#ffffff"
        }),
        files: serde_json::json!({}),
    };

    serde_json::to_string_pretty(&payload).map_err(|e| e.to_string())
}

fn diagrams_dir(project_root: &Path) -> PathBuf {
    project_root.join(FUN_DIR).join(DIAGRAMS_DIR)
}

fn validate_diagram_path(project_root: &Path, diagram_path: &Path) -> Result<(), String> {
    let expected_root = diagrams_dir(project_root);
    let canonical_project = project_root
        .canonicalize()
        .map_err(|e| e.to_string())?;
    let expected = expected_root
        .canonicalize()
        .or_else(|_| {
            fs::create_dir_all(&expected_root).map_err(|e| e.to_string())?;
            expected_root.canonicalize().map_err(|e| e.to_string())
        })?;

    let canonical_diagram = diagram_path
        .canonicalize()
        .map_err(|_| "Le fichier diagramme est introuvable.".to_string())?;

    if !canonical_diagram.starts_with(&expected) {
        return Err("Chemin diagramme non autorisé.".to_string());
    }

    if canonical_diagram.extension().and_then(|e| e.to_str()) != Some("excalidraw") {
        return Err("Extension de fichier invalide.".to_string());
    }

    if !canonical_diagram.starts_with(&canonical_project) {
        return Err("Le diagramme doit appartenir au projet ouvert.".to_string());
    }

    Ok(())
}

fn sketch_filename() -> String {
    let now = Local::now();
    let nanos = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.subsec_nanos())
        .unwrap_or(0);
    format!(
        "sketch-{}-{}.excalidraw",
        now.format("%Y%m%d-%H%M%S"),
        nanos
    )
}

pub fn create_diagram(project_root: &Path) -> Result<PathBuf, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let dir = diagrams_dir(project_root);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let content = empty_excalidraw_json()?;

    for _ in 0..10 {
        let path = dir.join(sketch_filename());
        if path.exists() {
            continue;
        }
        fs::write(&path, &content).map_err(|e| e.to_string())?;
        return Ok(path);
    }

    Err("Impossible de générer un nom de diagramme unique.".to_string())
}

pub fn load_diagram(project_root: &Path, diagram_path: &Path) -> Result<String, String> {
    validate_diagram_path(project_root, diagram_path)?;
    fs::read_to_string(diagram_path).map_err(|e| e.to_string())
}

pub fn save_diagram(
    project_root: &Path,
    diagram_path: &Path,
    content: &str,
) -> Result<(), String> {
    validate_diagram_path(project_root, diagram_path)?;

    let parsed: serde_json::Value =
        serde_json::from_str(content).map_err(|_| "JSON Excalidraw invalide.".to_string())?;

    if parsed.get("type").and_then(|v| v.as_str()) != Some("excalidraw") {
        return Err("JSON Excalidraw invalide.".to_string());
    }

    fs::write(diagram_path, content).map_err(|e| e.to_string())
}

#[derive(Debug, Serialize)]
pub struct DiagramEntry {
    pub path: String,
    pub name: String,
}

pub fn list_diagrams(project_root: &Path) -> Result<Vec<DiagramEntry>, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let dir = diagrams_dir(project_root);
    if !dir.exists() {
        return Ok(Vec::new());
    }

    let mut entries: Vec<(std::time::SystemTime, DiagramEntry)> = Vec::new();

    for entry in fs::read_dir(&dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|e| e.to_str()) != Some("excalidraw") {
            continue;
        }

        let modified = entry
            .metadata()
            .and_then(|m| m.modified())
            .unwrap_or(std::time::SystemTime::UNIX_EPOCH);

        let name = path
            .file_stem()
            .and_then(|n| n.to_str())
            .unwrap_or("diagramme")
            .to_string();

        entries.push((
            modified,
            DiagramEntry {
                path: path.to_string_lossy().into_owned(),
                name,
            },
        ));
    }

    entries.sort_by(|a, b| b.0.cmp(&a.0));

    Ok(entries.into_iter().map(|(_, entry)| entry).collect())
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_project() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let path = std::env::temp_dir().join(format!("fun-diagram-test-{nanos}"));
        fs::create_dir_all(&path).expect("create temp project");
        path
    }

    #[test]
    fn empty_excalidraw_json_is_valid_document() {
        let json = empty_excalidraw_json().expect("json");
        let parsed: serde_json::Value = serde_json::from_str(&json).expect("parse");
        assert_eq!(parsed["type"], "excalidraw");
        assert_eq!(parsed["version"], 2);
        assert!(parsed["elements"].as_array().unwrap().is_empty());
        assert_eq!(parsed["appState"]["viewBackgroundColor"], "#ffffff");
    }

    #[test]
    fn create_diagram_writes_under_fun_diagrams() {
        let project = temp_project();
        let diagram_path = create_diagram(&project).expect("create");
        assert!(diagram_path.exists());
        assert!(diagram_path.to_string_lossy().contains(".fun/diagrams/sketch-"));

        let content = load_diagram(&project, &diagram_path).expect("load");
        assert!(content.contains("\"type\": \"excalidraw\""));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn load_diagram_rejects_path_outside_diagrams_dir() {
        let project = temp_project();
        let outside = project.join("outside.excalidraw");
        fs::write(&outside, "{}").expect("write");

        let err = load_diagram(&project, &outside).expect_err("must reject");
        assert!(err.contains("non autorisé") || err.contains("introuvable"));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn save_diagram_persists_valid_json() {
        let project = temp_project();
        let diagram_path = create_diagram(&project).expect("create");

        let updated = r##"{"type":"excalidraw","version":2,"source":"https://excalidraw.com","elements":[{"id":"a","type":"rectangle"}],"appState":{"viewBackgroundColor":"#ffffff"},"files":{}}"##;
        save_diagram(&project, &diagram_path, updated).expect("save");

        let loaded = load_diagram(&project, &diagram_path).expect("load");
        assert!(loaded.contains("\"type\":\"excalidraw\"") || loaded.contains("\"type\": \"excalidraw\""));
        assert!(loaded.contains("rectangle"));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn save_diagram_rejects_invalid_type() {
        let project = temp_project();
        let diagram_path = create_diagram(&project).expect("create");

        let err = save_diagram(&project, &diagram_path, r#"{"type":"other"}"#)
            .expect_err("must reject");
        assert!(err.contains("invalide"));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn list_diagrams_returns_excalidraw_files() {
        let project = temp_project();
        let _ = create_diagram(&project).expect("create one");
        let _ = create_diagram(&project).expect("create two");

        let list = list_diagrams(&project).expect("list");
        assert_eq!(list.len(), 2);

        let _ = fs::remove_dir_all(project);
    }
}
