pub mod model;
pub mod openrouter;
pub mod secrets;

pub use model::{
    resolve_active_model, resolve_active_model_for_project, ActiveModelInfo, DEFAULT_FREE_MODEL,
};
pub use openrouter::{assert_free_model, is_free_model, OPENROUTER_API_BASE};
pub use secrets::{delete_api_key, has_api_key, store_api_key, validate_api_key};
