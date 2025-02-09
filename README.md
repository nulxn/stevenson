# stevenson

Stevenson is a tool to become the greatest strava runner of all time.

**GPX:** Takes in runs of different types and edits the pace

**Strava:** Uploads all the runs to Strava

## Installation

This project was created with Bun. So, you will install dependencies with:

```bash
bun install
```

Afterwards, you need to have a Strava API created. Use the values to fill in `.env`.

> Make sure the set both urls in the Strava API config as `localhost`.

**Example .env:**

```js
ID = client_id;
SECRET = client_secret;
```

Also, edit config.ts to have your Strava username (does not have to be the one associated with the API key, but is the one that the runs will be uploaded to)

### Commands

- Build output folder: `bun --bun run build`
- OAuth2 Strava Server (to get auth key): `bun --bun run dev`
- Upload runs to Strava: `bun --bun run deploy`

## Configuration

1. Create an `output` and `runs` folder.

2. In the `runs` folder, create subfolders called `breakdays`, `longruns`, `premeet`, and `workouts`.

Add different .gpx files to all of the folders in the **runs** folder. For runs in the **longruns** and **breakdays** folder, they need to follow the following format:

```
{ name } - { distance }.gpx
```

> **Note that the distance doesn't have to be accurate, and just needs to be there.** I don't know why I made it this way.

Also remember to edit both .env and config.ts like I said in step one.

After you have all the runs uploaded, you can run `bun --bun run build` to build the output directory.

## Getting Authentication (Strava)

1. Run `bun --bun run dev` to get two links. The first one is an OAuth2 link from strava, and the other is the server url.

2. Click on the **first link** and accept the request. It should then redirect you to the localhost server and then save your access token to the database.

## Uploading (to Strava)

Run `bun --bun run publish`. This will start to upload all your runs.

> **Note:** You will probably be rate limited (200 reqs in 15 mins), however the upload feature already detects if the run has already been uploaded. So, if you get rate limited, `Ctrl+c` the terminal and wait a few minutes before running the command again.

## Todo

- [ ] Warm-ups
- [ ] Moving more stuff to config.ts
- [ ] Allowing duplicates
