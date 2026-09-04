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
    Electro,
}

impl FunTheme {
    pub fn parse(value: &str) -> Result<Self, String> {
        match value {
            "light" => Ok(FunTheme::Light),
            "dark" => Ok(FunTheme::Dark),
            "electro" => Ok(FunTheme::Electro),
            _ => Err("Thème invalide.".to_string()),
        }
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            FunTheme::Light => "light",
            FunTheme::Dark => "dark",
            FunTheme::Electro => "electro",
        }
    }
}

impl Default for FunTheme {
    fn default() -> Self {
        FunTheme::Light
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CompanionPosition {
    pub x: i32,
    pub y: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct CustomColors {
    #[serde(default)]
    pub background: Option<String>,
    #[serde(default)]
    pub canvas: Option<String>,
    #[serde(default)]
    pub foreground: Option<String>,
    #[serde(default)]
    pub accent: Option<String>,
    #[serde(default)]
    pub border: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ProjectSettings {
    pub pomodoro_work_minutes: u32,
    pub pomodoro_break_minutes: u32,
    #[serde(default)]
    pub theme: FunTheme,
    #[serde(default)]
    pub custom_colors: Option<CustomColors>,
    #[serde(default)]
    pub companion_chat: Option<CompanionPosition>,
    #[serde(default)]
    pub companion_pomo: Option<CompanionPosition>,
    #[serde(default = "default_lofi_muted")]
    pub lofi_muted: bool,
    #[serde(default = "default_lofi_volume")]
    pub lofi_volume: u8,
}

fn default_lofi_muted() -> bool {
    false
}

fn default_lofi_volume() -> u8 {
    40
}

impl Default for ProjectSettings {
    fn default() -> Self {
        ProjectSettings {
            pomodoro_work_minutes: 25,
            pomodoro_break_minutes: 5,
            theme: FunTheme::Light,
            custom_colors: None,
            companion_chat: None,
            companion_pomo: None,
            lofi_muted: false,
            lofi_volume: 40,
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

pub fn set_custom_colors(
    project_root: &Path,
    colors: Option<CustomColors>,
) -> Result<ProjectSettings, String> {
    let mut settings = read_settings(project_root)?;
    settings.custom_colors = colors;
    write_settings(project_root, &settings)?;
    Ok(settings)
}

pub fn set_pomodoro_durations(
    project_root: &Path,
    work_minutes: u32,
    break_minutes: u32,
) -> Result<ProjectSettings, String> {
    let mut settings = read_settings(project_root)?;
    settings.pomodoro_work_minutes = work_minutes;
    settings.pomodoro_break_minutes = break_minutes;
    write_settings(project_root, &settings)?;
    Ok(settings)
}

pub fn set_companion_position(
    project_root: &Path,
    companion: &str,
    x: i32,
    y: i32,
) -> Result<ProjectSettings, String> {
    let mut settings = read_settings(project_root)?;
    let position = CompanionPosition { x, y };
    match companion {
        "chat" => settings.companion_chat = Some(position),
        "pomo" => settings.companion_pomo = Some(position),
        _ => return Err("Compagnon inconnu.".to_string()),
    }
    write_settings(project_root, &settings)?;
    Ok(settings)
}

pub fn set_lofi_prefs(
    project_root: &Path,
    muted: bool,
    volume: u8,
) -> Result<ProjectSettings, String> {
    let mut settings = read_settings(project_root)?;
    settings.lofi_muted = muted;
    settings.lofi_volume = volume.min(100);
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
    fn set_companion_position_persists() {
        let project = temp_project();
        let updated =
            set_companion_position(&project, "chat", 120, 340).expect("set chat");
        assert_eq!(
            updated.companion_chat,
            Some(CompanionPosition { x: 120, y: 340 })
        );

        let reloaded = read_settings(&project).expect("reload");
        assert_eq!(
            reloaded.companion_chat,
            Some(CompanionPosition { x: 120, y: 340 })
        );

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn set_lofi_prefs_persists() {
        let project = temp_project();
        let updated = set_lofi_prefs(&project, true, 55).expect("set lofi");
        assert!(updated.lofi_muted);
        assert_eq!(updated.lofi_volume, 55);

        let reloaded = read_settings(&project).expect("reload");
        assert!(reloaded.lofi_muted);
        assert_eq!(reloaded.lofi_volume, 55);

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn set_custom_colors_persists() {
        let project = temp_project();
        let colors = CustomColors {
            background: Some("#ff0000".to_string()),
            canvas: Some("#00ff00".to_string()),
            foreground: None,
            accent: None,
            border: None,
        };
        let updated = set_custom_colors(&project, Some(colors.clone())).expect("set colors");
        assert_eq!(updated.custom_colors, Some(colors.clone()));

        let reloaded = read_settings(&project).expect("reload");
        assert_eq!(reloaded.custom_colors, Some(colors));

        let _ = fs::remove_dir_all(project);
    }

    #[test]
    fn set_custom_colors_reset_to_none() {
        let project = temp_project();
        let colors = CustomColors {
            background: Some("#ff0000".to_string()),
            canvas: None,
            foreground: None,
            accent: None,
            border: None,
        };
        set_custom_colors(&project, Some(colors)).expect("set");
        let updated = set_custom_colors(&project, None).expect("reset");
        assert!(updated.custom_colors.is_none());

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
