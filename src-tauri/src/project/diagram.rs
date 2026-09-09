use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";
const DIAGRAMS_DIR: &str = "diagrams";

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum DiagramKind {
    Sketch,
    Drawio,
    Plantuml,
}

impl DiagramKind {
    pub fn as_str(self) -> &'static str {
        match self {
            DiagramKind::Sketch => "sketch",
            DiagramKind::Drawio => "drawio",
            DiagramKind::Plantuml => "plantuml",
        }
    }

    pub fn extension(self) -> &'static str {
        match self {
            DiagramKind::Sketch => "excalidraw",
            DiagramKind::Drawio => "drawio",
            DiagramKind::Plantuml => "puml",
        }
    }

    pub fn filename_prefix(self) -> &'static str {
        match self {
            DiagramKind::Sketch => "croquis",
            DiagramKind::Drawio => "uml",
            DiagramKind::Plantuml => "plantuml",
        }
    }

    pub fn parse(value: &str) -> Result<Self, String> {
        match value.trim().to_ascii_lowercase().as_str() {
            "sketch" | "excalidraw" => Ok(DiagramKind::Sketch),
            "drawio" | "uml" => Ok(DiagramKind::Drawio),
            "plantuml" | "puml" => Ok(DiagramKind::Plantuml),
            _ => Err(format!("Type de diagramme inconnu : {value}")),
        }
    }

    pub fn from_path(path: &Path) -> Result<Self, String> {
        match path.extension().and_then(|e| e.to_str()) {
            Some("excalidraw") => Ok(DiagramKind::Sketch),
            Some("drawio") => Ok(DiagramKind::Drawio),
            Some("puml") => Ok(DiagramKind::Plantuml),
            _ => Err("Extension de fichier invalide.".to_string()),
        }
    }
}

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

pub fn empty_drawio_xml() -> String {
    r#"<mxfile host="app.diagrams.net" modified="2024-01-01T00:00:00.000Z" agent="Fun" version="24.0.0" etag="abc123" type="device"><diagram name="Page-1" id="abc123"><mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tool="default" math="0" shadow="0"><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>"#.to_string()
}

pub fn empty_plantuml() -> String {
    "@startuml\n@enduml\n".to_string()
}

pub fn empty_content_for_kind(kind: DiagramKind) -> Result<String, String> {
    match kind {
        DiagramKind::Sketch => empty_excalidraw_json(),
        DiagramKind::Drawio => Ok(empty_drawio_xml()),
        DiagramKind::Plantuml => Ok(empty_plantuml()),
    }
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

    DiagramKind::from_path(&canonical_diagram)?;

    if !canonical_diagram.starts_with(&canonical_project) {
        return Err("Le diagramme doit appartenir au projet ouvert.".to_string());
    }

    Ok(())
}

fn next_numbered_filename(dir: &Path, kind: DiagramKind) -> String {
    let mut max = 0u32;
    let prefix = format!("{}-", kind.filename_prefix());
    let ext = kind.extension();

    if dir.exists() {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().and_then(|e| e.to_str()) != Some(ext) {
                    continue;
                }
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    if let Some(num_str) = stem.strip_prefix(&prefix) {
                        if let Ok(num) = num_str.parse::<u32>() {
                            max = max.max(num);
                        }
                    }
                }
            }
        }
    }

    format!("{}{}.{}", prefix, max + 1, ext)
}

pub fn create_diagram_of_kind(project_root: &Path, kind: DiagramKind) -> Result<PathBuf, String> {
    create_diagram_with_content(project_root, kind, &empty_content_for_kind(kind)?)
}

pub fn create_diagram_with_content(
    project_root: &Path,
    kind: DiagramKind,
    content: &str,
) -> Result<PathBuf, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    validate_content_for_kind(kind, content)?;

    let dir = diagrams_dir(project_root);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    for _ in 0..10 {
        let path = dir.join(next_numbered_filename(&dir, kind));
        if path.exists() {
            continue;
        }
        fs::write(&path, content).map_err(|e| e.to_string())?;
        return Ok(path);
    }

    Err("Impossible de générer un nom de diagramme unique.".to_string())
}

pub fn write_capture_diagram(
    project_root: &Path,
    kind: DiagramKind,
    content: &str,
) -> Result<PathBuf, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    validate_content_for_kind(kind, content)?;

    let dir = diagrams_dir(project_root);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let mut max = 0u32;
    if dir.exists() {
        if let Ok(entries) = fs::read_dir(&dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    if let Some(num_str) = stem.strip_prefix("capture-") {
                        if let Ok(num) = num_str.parse::<u32>() {
                            max = max.max(num);
                        }
                    }
                }
            }
        }
    }

    let path = dir.join(format!("capture-{}.{}", max + 1, kind.extension()));
    fs::write(&path, content).map_err(|e| e.to_string())?;
    Ok(path)
}

pub fn create_diagram(project_root: &Path) -> Result<PathBuf, String> {
    create_diagram_of_kind(project_root, DiagramKind::Sketch)
}

pub fn create_drawio_diagram(project_root: &Path) -> Result<PathBuf, String> {
    create_diagram_of_kind(project_root, DiagramKind::Drawio)
}

pub fn load_drawio_diagram(project_root: &Path, diagram_path: &Path) -> Result<String, String> {
    validate_diagram_path(project_root, diagram_path)?;
    fs::read_to_string(diagram_path).map_err(|e| e.to_string())
}

pub fn save_drawio_diagram(
    project_root: &Path,
    diagram_path: &Path,
    content: &str,
) -> Result<(), String> {
    validate_diagram_path(project_root, diagram_path)?;
    fs::write(diagram_path, content).map_err(|e| e.to_string())
}

pub fn load_diagram(project_root: &Path, diagram_path: &Path) -> Result<String, String> {
    validate_diagram_path(project_root, diagram_path)?;
    fs::read_to_string(diagram_path).map_err(|e| e.to_string())
}

fn validate_content_for_kind(kind: DiagramKind, content: &str) -> Result<(), String> {
    match kind {
        DiagramKind::Sketch => {
            let parsed: serde_json::Value = serde_json::from_str(content)
                .map_err(|_| "JSON Excalidraw invalide.".to_string())?;
            if parsed.get("type").and_then(|v| v.as_str()) != Some("excalidraw") {
                return Err("JSON Excalidraw invalide.".to_string());
            }
            Ok(())
        }
        DiagramKind::Drawio => {
            if !content.contains("mxfile") && !content.contains("mxGraphModel") {
                return Err("XML draw.io invalide.".to_string());
            }
            Ok(())
        }
        DiagramKind::Plantuml => Ok(()),
    }
}

pub fn save_diagram(
    project_root: &Path,
    diagram_path: &Path,
    content: &str,
) -> Result<(), String> {
    validate_diagram_path(project_root, diagram_path)?;
    let kind = DiagramKind::from_path(diagram_path)?;
    validate_content_for_kind(kind, content)?;
    fs::write(diagram_path, content).map_err(|e| e.to_string())
}

/// Valide qu'une chaîne est un JSON Excalidraw valide (type=="excalidraw", version==2, elements tableau).
pub fn validate_excalidraw_json(json: &str) -> Result<(), String> {
    let parsed: serde_json::Value =
        serde_json::from_str(json).map_err(|_| "JSON Excalidraw invalide.".to_string())?;

    if parsed.get("type").and_then(|v| v.as_str()) != Some("excalidraw") {
        return Err("JSON Excalidraw invalide : type manquant ou incorrect.".to_string());
    }

    if parsed.get("version").and_then(|v| v.as_u64()) != Some(2) {
        return Err("JSON Excalidraw invalide : version doit être 2.".to_string());
    }

    if !parsed.get("elements").and_then(|v| v.as_array()).is_some() {
        return Err("JSON Excalidraw invalide : éléments manquants.".to_string());
    }

    Ok(())
}

/// Reset du diagramme : écrase le fichier avec un document vide du même type.
pub fn reset_diagram(project_root: &Path, diagram_path: &Path) -> Result<String, String> {
    validate_diagram_path(project_root, diagram_path)?;
    let kind = DiagramKind::from_path(diagram_path)?;
    let content = empty_content_for_kind(kind)?;
    fs::write(diagram_path, &content).map_err(|e| e.to_string())?;
    Ok(content)
}

/// Écrit un diagramme UML généré depuis le code dans `.fun/diagrams/uml-<iso8601>.excalidraw` (AD-7).
pub fn write_uml_diagram(project_root: &Path, json: &str) -> Result<PathBuf, String> {
    validate_excalidraw_json(json)?;

    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let dir = diagrams_dir(project_root);
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;

    let now = chrono::Utc::now();
    let filename = format!("uml-{}.excalidraw", now.format("%Y%m%dT%H%M%SZ"));
    let path = dir.join(filename);

    fs::write(&path, json).map_err(|e| e.to_string())?;
    Ok(path)
}

#[derive(Debug, Serialize)]
pub struct DiagramEntry {
    pub path: String,
    pub name: String,
    pub kind: DiagramKind,
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

        let Ok(kind) = DiagramKind::from_path(&path) else {
            continue;
        };

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
                kind,
            },
        ));
    }

    entries.sort_by(|a, b| b.0.cmp(&a.0));

    Ok(entries.into_iter().map(|(_, entry)| entry).collect())
}

/// Supprime un fichier diagramme sous `.fun/diagrams/` (validation chemin AD-4).
pub fn delete_diagram(project_root: &Path, diagram_path: &Path) -> Result<(), String> {
    validate_diagram_path(project_root, diagram_path)?;
    fs::remove_file(diagram_path).map_err(|e| format!("Impossible de supprimer le fichier : {e}"))
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
        assert!(diagram_path.to_string_lossy().contains(".fun/diagrams/croquis-"));

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
    fn delete_diagram_removes_file() {
        let project = temp_project();
        let diagram_path = create_diagram(&project).expect("create");
        assert!(diagram_path.exists());

        delete_diagram(&project, &diagram_path).expect("delete");
        assert!(!diagram_path.exists());

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn delete_diagram_rejects_path_outside_diagrams_dir() {
        let project = temp_project();
        let outside = project.join("outside.excalidraw");
        fs::write(&outside, "{}").expect("write");

        let err = delete_diagram(&project, &outside).expect_err("must reject");
        assert!(err.contains("non autorisé") || err.contains("introuvable"));

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

    #[test]
    fn validate_excalidraw_json_accepts_valid() {
        let json = r#"{ "type": "excalidraw", "version": 2, "elements": [], "appState": {}, "files": {} }"#;
        assert!(validate_excalidraw_json(json).is_ok());
    }

    #[test]
    fn validate_excalidraw_json_rejects_wrong_type() {
        let json = r#"{ "type": "other", "version": 2, "elements": [] }"#;
        let err = validate_excalidraw_json(json).expect_err("must reject");
        assert!(err.contains("type") || err.contains("invalide"));
    }

    #[test]
    fn validate_excalidraw_json_rejects_wrong_version() {
        let json = r#"{ "type": "excalidraw", "version": 3, "elements": [] }"#;
        let err = validate_excalidraw_json(json).expect_err("must reject");
        assert!(err.contains("version") || err.contains("invalide"));
    }

    #[test]
    fn validate_excalidraw_json_rejects_missing_elements() {
        let json = r#"{ "type": "excalidraw", "version": 2 }"#;
        let err = validate_excalidraw_json(json).expect_err("must reject");
        assert!(err.contains("éléments") || err.contains("invalide"));
    }

    #[test]
    #[test]
    fn reset_diagram_drawio_writes_empty_xml() {
        let project = temp_project();
        let path = create_drawio_diagram(&project).expect("create");
        fs::write(&path, "<mxfile><diagram>not-empty</diagram></mxfile>").expect("write");

        let content = reset_diagram(&project, &path).expect("reset");
        assert!(content.contains("mxGraphModel"));
        assert!(content.contains("<mxCell id=\"0\"/>"));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn reset_diagram_plantuml_writes_empty_source() {
        let project = temp_project();
        let path = create_diagram_of_kind(&project, DiagramKind::Plantuml).expect("create");
        fs::write(&path, "@startuml\nA -> B\n@enduml\n").expect("write");

        let content = reset_diagram(&project, &path).expect("reset");
        assert_eq!(content, empty_plantuml());

        let _ = fs::remove_dir_all(project);
    }

    fn reset_diagram_overwrites_with_empty() {
        let project = temp_project();
        let diagram_path = create_diagram(&project).expect("create");
        let content = load_diagram(&project, &diagram_path).expect("load");
        assert!(content.contains("rectangle") || content.contains("type"));

        reset_diagram(&project, &diagram_path).expect("reset");

        let reset_content = load_diagram(&project, &diagram_path).expect("load after reset");
        let parsed: serde_json::Value = serde_json::from_str(&reset_content).expect("parse");
        assert_eq!(parsed["type"], "excalidraw");
        assert!(parsed["elements"].as_array().unwrap().is_empty());
        assert_eq!(diagram_path.file_stem().unwrap().to_str().unwrap(), diagram_path.file_stem().unwrap().to_str().unwrap());

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn write_uml_diagram_writes_valid_json() {
        let project = temp_project();
        let json = r#"{ "type": "excalidraw", "version": 2, "elements": [{"id":"c1","type":"rectangle","x":0,"y":0,"width":200,"height":100}], "appState": {}, "files": {} }"#;
        let path = write_uml_diagram(&project, json).expect("write");

        assert!(path.exists());
        assert!(path.to_string_lossy().contains(".fun/diagrams/uml-"));
        assert!(path.to_string_lossy().ends_with(".excalidraw"));

        let written = fs::read_to_string(&path).expect("read");
        let parsed: serde_json::Value = serde_json::from_str(&written).expect("parse");
        assert_eq!(parsed["type"], "excalidraw");
        assert_eq!(parsed["version"], 2);
        assert!(!parsed["elements"].as_array().unwrap().is_empty());

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn write_uml_diagram_rejects_invalid_json() {
        let project = temp_project();
        let json = r#"{ "type": "other" }"#;
        let err = write_uml_diagram(&project, json).expect_err("must reject");
        assert!(err.contains("invalide") || err.contains("type") || err.contains("version"));

        let dir = project.join(".fun").join("diagrams");
        let count = if dir.exists() {
            fs::read_dir(&dir).unwrap().count()
        } else {
            0
        };
        assert_eq!(count, 0, "aucun fichier écrit en cas d'erreur");

        let _ = fs::remove_dir_all(project);
    }
}
