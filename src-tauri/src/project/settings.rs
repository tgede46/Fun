use serde::{Deserialize, Serialize};
use std::fs;
use std::path::{Path, PathBuf};

const FUN_DIR: &str = ".fun";
const SETTINGS_FILE: &str = "settings.json";

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum FunTheme {
    Light,
    Dark,
}

impl FunTheme {
    pub fn parse(value: &str) -> Result<Self, String> {
        match value {
            "light" => Ok(FunTheme::Light),
            "dark" => Ok(FunTheme::Dark),
            _ => Err("Thème invalide.".to_string()),
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            FunTheme::Light => "light",
            FunTheme::Dark => "dark",
        }
    }
}

impl Default for FunTheme {
    fn default() -> Self {
        FunTheme::Light
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProjectSettings {
    pub pomodoro_work_minutes: u32,
    pub pomodoro_break_minutes: u32,
    #[serde(default)]
    pub theme: FunTheme,
}

impl Default for ProjectSettings {
    fn default() -> Self {
        ProjectSettings {
            pomodoro_work_minutes: 25,
            pomodoro_break_minutes: 5,
            theme: FunTheme::Light,
        }
    }
}

fn settings_path(project_root: &Path) -> PathBuf {
    project_root.join(FUN_DIR).join(SETTINGS_FILE)
}

pub fn read_settings(project_root: &Path) -> Result<ProjectSettings, String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let path = settings_path(project_root);
    if !path.exists() {
        return Ok(ProjectSettings::default());
    }

    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| e.to_string())
}

pub fn write_settings(project_root: &Path, settings: &ProjectSettings) -> Result<(), String> {
    if !project_root.is_dir() {
        return Err("Le dossier projet est introuvable.".to_string());
    }

    let path = settings_path(project_root);
    let content = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())
}

pub fn set_theme(project_root: &Path, theme: FunTheme) -> Result<ProjectSettings, String> {
    let mut settings = read_settings(project_root)?;
    settings.theme = theme;
    write_settings(project_root, &settings)?;
    Ok(settings)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_project() -> PathBuf {
        let nanos = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .expect("clock")
            .as_nanos();
        let path = std::env::temp_dir().join(format!("fun-settings-test-{nanos}"));
        fs::create_dir_all(path.join(FUN_DIR)).expect("create .fun");
        path
    }

    #[test]
    fn read_settings_defaults_when_missing() {
        let project = temp_project();
        let settings = read_settings(&project).expect("read");
        assert_eq!(settings.theme, FunTheme::Light);
        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn set_theme_persists_to_settings_json() {
        let project = temp_project();
        let updated = set_theme(&project, FunTheme::Dark).expect("set");
        assert_eq!(updated.theme, FunTheme::Dark);

        let reloaded = read_settings(&project).expect("reload");
        assert_eq!(reloaded.theme, FunTheme::Dark);

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn legacy_settings_without_theme_defaults_light() {
        let project = temp_project();
        fs::write(
            settings_path(&project),
            r#"{"pomodoro_work_minutes":25,"pomodoro_break_minutes":5}"#,
        )
        .expect("write");

        let settings = read_settings(&project).expect("read");
        assert_eq!(settings.theme, FunTheme::Light);

        let _ = fs::remove_dir_all(project);
    }
}
