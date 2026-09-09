pub mod benchmark;
pub mod chat;
pub mod client;
pub mod intent;
pub mod model;
pub mod openrouter;
pub mod personas;
pub mod secrets;

pub use benchmark::{check_and_run_if_stale, ModelScore, StalenessCheck};
pub use chat::{
    generate_diagram_from_code, generate_diagram_from_image, send_chat, ChatTurn, SendChatResult,
};
pub use model::resolve_active_model_for_project;
pub use openrouter::OPENROUTER_API_BASE;
pub use secrets::{has_api_key, load_api_key};
