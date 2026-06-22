use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
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
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
