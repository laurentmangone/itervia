mod crypto;

use serde::{Deserialize, Serialize};

#[tauri::command]
fn encrypt_value(plaintext: String) -> Result<String, String> {
    crypto::encrypt(&plaintext)
}

#[tauri::command]
fn decrypt_value(encoded: String) -> Result<String, String> {
    crypto::decrypt(&encoded)
}

#[derive(Serialize, Deserialize)]
struct OrsCoordinate {
    lng: f64,
    lat: f64,
}

#[derive(Serialize, Deserialize)]
struct OrsRequest {
    coordinates: Vec<OrsCoordinate>,
    profile: String,
    api_key: String,
}

#[derive(Serialize, Deserialize, Debug)]
struct OrsResponse {
    features: Vec<OrsFeature>,
}

#[derive(Serialize, Deserialize, Debug)]
struct OrsFeature {
    geometry: serde_json::Value,
    properties: OrsProperties,
}

#[derive(Serialize, Deserialize, Debug)]
struct OrsProperties {
    segments: Option<Vec<OrsSegment>>,
}

#[derive(Serialize, Deserialize, Debug)]
struct OrsSegment {
    distance: f64,
    duration: f64,
}

#[tauri::command]
async fn calculate_ors_route(request: OrsRequest) -> Result<serde_json::Value, String> {
    let coords: Vec<Vec<f64>> = request.coordinates.iter().map(|c| vec![c.lng, c.lat]).collect();

    let client = reqwest::Client::new();
    let url = format!(
        "https://api.openrouteservice.org/v2/directions/{}/geojson",
        request.profile
    );

    let body = serde_json::json!({
        "coordinates": coords,
        "elevation": true,
        "geometry": true,
    });

    let resp = client
        .post(&url)
        .header("Authorization", &request.api_key)
        .header("Content-Type", "application/json")
        .header("Accept", "application/geo+json")
        .json(&body)
        .send()
        .await
        .map_err(|e| format!("Erreur réseau: {}", e))?;

    let status = resp.status();
    if !status.is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(format!("ORS API error {}: {}", status, text));
    }

    let json: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| format!("Erreur parsing: {}", e))?;

    Ok(json)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    use tauri_plugin_sql::{Migration, MigrationKind};

    let migrations = vec![
        Migration {
            version: 1,
            description: "create routes table",
            sql: "CREATE TABLE IF NOT EXISTS routes (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL DEFAULT '',
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL,
                distance REAL,
                duration REAL,
                elevation_gain REAL,
                geometry TEXT,
                elevation_profile TEXT
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create route_points table",
            sql: "CREATE TABLE IF NOT EXISTS route_points (
                id TEXT PRIMARY KEY,
                route_id TEXT NOT NULL,
                lng REAL NOT NULL,
                lat REAL NOT NULL,
                point_order INTEGER NOT NULL,
                FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create indexes",
            sql: "CREATE INDEX IF NOT EXISTS idx_route_points_route_id ON route_points(route_id);
                   CREATE INDEX IF NOT EXISTS idx_route_points_order ON route_points(route_id, point_order);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "create preferences table",
            sql: "CREATE TABLE IF NOT EXISTS preferences (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );",
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:itervia.db", migrations)
                .build(),
        )
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .invoke_handler(tauri::generate_handler![
            encrypt_value,
            decrypt_value,
            calculate_ors_route
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
