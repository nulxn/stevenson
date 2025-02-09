import { Database } from "bun:sqlite";

const config = Object.fromEntries(
  Object.entries(Bun.env).map(([key, value]) => [key.toLowerCase(), value])
) as {
  id: string;
  secret: string;
};
const db = new Database("users.db", { create: true });

interface User {
  id: number;
  access_token: string;
  refresh_token: string;
  expires_at: number;
  username: string;
  name: string;
}

async function getUser(username: string) {
  return db
    .query("SELECT * FROM users WHERE username = ?")
    .get(username) as User;
}

async function refreshToken(user: User) {
  const response = await fetch("https://www.strava.com/api/v3/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.id,
      client_secret: config.secret,
      refresh_token: user.refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to refresh token: ${response.statusText}`);
  }

  const data = await response.json();
  await db
    .query("UPDATE users SET access_token = ?, expires_at = ? WHERE id = ?")
    .run(data.access_token, data.expires_at, user.id);

  return {
    access_token: data.access_token,
    expires_at: data.expires_at,
  };
}

async function uploadRun(user: User, filepath: string, title: string) {
  if (user.expires_at < Date.now() / 1000) {
    const { access_token, expires_at } = await refreshToken(user);
    user.access_token = access_token;
    user.expires_at = expires_at;
  }

  const formData = new FormData();
  formData.append("file", Bun.file(filepath));
  formData.append("name", title.replaceAll("  ", " ").replaceAll(".gpx", ""));
  formData.append("data_type", "gpx");

  const response = await fetch("https://www.strava.com/api/v3/uploads", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload run: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function checkProgress(user: User, id: number) {
  if (user.expires_at < Date.now() / 1000) {
    const { access_token, expires_at } = await refreshToken(user);
    user.access_token = access_token;
    user.expires_at = expires_at;
  }

  let response = await fetch(`https://www.strava.com/api/v3/uploads/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${user.access_token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to check progress: ${response.statusText}`);
  }

  const data = await response.json();
  return data;
}

async function getAllRuns(user: User) {
  if (user.expires_at < Date.now() / 1000) {
    const { access_token, expires_at } = await refreshToken(user);
    user.access_token = access_token;
    user.expires_at = expires_at;
  }

  let res = await fetch(
    "https://www.strava.com/api/v3/athlete/activities?per_page=200",
    {
      headers: {
        Authorization: `Bearer ${user.access_token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Failed to get runs: ${res.statusText}`);
  }

  let data = await res.json();
  return data;
}

export { getUser, refreshToken, uploadRun, checkProgress, getAllRuns };
