import { Database } from "bun:sqlite";

const config = Object.fromEntries(
  Object.entries(Bun.env).map(([key, value]) => [key.toLowerCase(), value])
);
const db = new Database("users.db", { create: true });
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    username TEXT,
    name TEXT
)`);

console.log(
  `https://www.strava.com/oauth/authorize?client_id=${
    config.id
  }&redirect_uri=http%3A%2F%2Flocalhost:3000&response_type=code&approval_prompt=auto&scope=${encodeURIComponent(
    "activity:write,activity:read_all"
  )}`
);

const server = Bun.serve({
  port: 3000,
  fetch: async (req) => {
    const url = new URL(req.url);
    if (url.pathname !== "/") return new Response("Not found", { status: 404 });
    else {
      const code = url.searchParams.get("code");
      if (!code) return new Response("No code", { status: 400 });

      const response = await fetch(
        "https://www.strava.com/api/v3/oauth/token",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: config.id,
            client_secret: config.secret,
            code,
            grant_type: "authorization_code",
          }),
        }
      );
      const data = await response.json();
      if (!response.ok) return new Response("Error", { status: 500 });

      const existingUser = db
        .query("SELECT * FROM users WHERE username = ?")
        .get(data.athlete.username);
      if (existingUser)
        return new Response("User already exists", { status: 400 });

      await db
        .query(
          "INSERT INTO users (access_token, refresh_token, expires_at, username, name) VALUES (?, ?, ?, ?, ?)"
        )
        .run(
          data.access_token,
          data.refresh_token,
          data.expires_at,
          data.athlete.username,
          data.athlete.firstname + " " + data.athlete.lastname
        );

      return new Response(
        JSON.stringify({
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at,
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
});

console.log("Server running http://localhost:3000");
