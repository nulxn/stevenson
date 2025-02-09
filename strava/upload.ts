import { uploadRun, getUser, checkProgress, getAllRuns } from "./api";
import config from "../config";
import { getRunName } from "../gpx";

import { readdir } from "node:fs/promises";
import path from "node:path";
const __dirname = path.resolve();

const prefix = __dirname + "/output/" + config.username + "/";
const output = await readdir(prefix);
const user = await getUser(config.username);

let runs = (await getAllRuns(user)).map(
  (v: any) => v.start_date.split("T")[0] + ".gpx"
);

let i = 0;
for (const file of output) {
  i++;

  if (runs.includes(file)) {
    console.log(`Skipping ${file} as it is already uploaded.`);
    continue;
  }

  let name = await getRunName(prefix + file);
  let data = await uploadRun(user, prefix + file, name);
  let id = data.id;
  
  console.log(`Uploaded ${name} with id ${id}`);

  await new Promise((resolve) => {
    let checkInterval = setInterval(async () => {
      let progress = await checkProgress(user, id);
      if (progress.status === "Your activity is ready.") {
        console.log(`\tActivity ${id} is ready! (${i}/${output.length})`);
        clearInterval(checkInterval);
        resolve(null);
      }
    }, 3500);
  });
}
