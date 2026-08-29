pub mod model;
pub mod openrouter;
pub mod secrets;

pub use model::resolve_active_model_for_project;
pub use openrouter::OPENROUTER_API_BASE;
pub use secrets::has_api_key;
