console.clear();

import { readdir, mkdir } from "node:fs/promises";
import path from "node:path";
const __dirname = path.resolve();

import type { Schedule } from "./types";
import { uploadRun, getUser } from "./strava/api";
import { formatRun, findAvgPace } from "./gpx";
import config from "./config";

const gpxs: { [key: string]: string[] } = {};
gpxs["workout"] = await readdir(__dirname + "/runs/workouts");
gpxs["premeet"] = await readdir(__dirname + "/runs/premeet");
gpxs["longrun"] = await readdir(__dirname + "/runs/longruns");
gpxs["breakday"] = await readdir(__dirname + "/runs/breakdays");

const iterateDates = async (start: Date, end: Date) => {
  type ScheduledType = "workout" | "premeet" | "longrun" | "breakday";
  const current = new Date(start);
  while (current <= end) {
    let day = current
      .toLocaleDateString("en-US", { weekday: "long" })
      .toLowerCase();
    if (!config.schedule[day]) {
      current.setDate(current.getDate() + 1);
      continue;
    }
    let scheduledType = config.schedule[day] as ScheduledType;
    let folder = gpxs[scheduledType];

    let run = folder[Math.floor(Math.random() * folder.length)];
    let distance = 0;
    let name = "";

    let folderType: { [key in ScheduledType]: string } = {
      workout: "workouts",
      premeet: "premeet",
      longrun: "longruns",
      breakday: "breakdays",
    };

    if (scheduledType === "breakday" || scheduledType === "longrun") {
      const runParts = run.split("- ");
      if (runParts[1]) {
        distance = Number(runParts[1].split(".gpx")[0]);
      }
      name = run
        .split("- ")[0]
        .replace(/([A-Z])/g, " $1")
        .trim();
    } else {
      name = run
        .split(".gpx")[0]
        .replace(/([A-Z])/g, " $1")
        .trim();
    }

    let outputFolder = await readdir(__dirname + "/output/");
    let fileName = current.toISOString().split("T")[0] + ".gpx";

    if (!outputFolder.includes(config.username))
      await mkdir(__dirname + "/output/" + config.username);

    let oldPace = await findAvgPace(
      __dirname + "/runs/" + folderType[scheduledType] + "/" + run
    );
    let newPace: string;
    if (!oldPace) {
      switch (scheduledType) {
        case "longrun":
          newPace = "6:16";
          break;
        case "workout":
          newPace = "5:03";
          break;
        case "premeet":
          newPace = "7:12";
          break;
        case "breakday":
          newPace = "6:35";
          break;
        default:
          newPace = "6:01";
      }
    } else {
      let paceParts = oldPace.split(":").map(Number);

      let totalSeconds = paceParts[0] * 60 + paceParts[1] - 15;
      let minutes = Math.floor(totalSeconds / 60);
      let seconds = totalSeconds % 60;

      newPace = `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }

    await Bun.write(
      __dirname + "/output/" + config.username + "/" + fileName,
      await formatRun(
        __dirname + "/runs/" + folderType[scheduledType] + "/" + run,
        current.toISOString(),
        newPace,
        name
      )
    );

    console.log(
      `On ${current.toLocaleDateString("en-US", { weekday: "long" })}, ${
        current.toISOString().split("T")[0]
      }, you have a ${scheduledType} run named "${name}"${
        distance ? ` with a distance of ${distance} mi` : ""
      }.`
    );

    current.setDate(current.getDate() + 1);
  }
};

await iterateDates(config.dates.startingDate, config.dates.today);
