use std::sync::Mutex;

pub struct AppState {
    pub current_project: Mutex<Option<String>>,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            current_project: Mutex::new(None),
        }
    }
}
