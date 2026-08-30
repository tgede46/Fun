use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn write_config_outside_fun(project_root: PathBuf) -> Result<(), String> {
    // Simule une écriture hors .fun/ pour test AD-5
    let config_path = project_root.join("config.json");
    let data = r#"{"test": true}"#;
    fs::write(&config_path, data).map_err(|e| e.to_string())
}
