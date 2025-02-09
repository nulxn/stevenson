import type { Schedule } from "./types";

const config = {
  username: "peterstevenson",
  schedule: {
    monday: "longrun",
    tuesday: "workout",
    wednesday: "breakday",
    thursday: "workout",
    friday: "premeet",
  } as Schedule,
  dates: {
    today: new Date(),
    startingDate: new Date("2024-06-05"), // euro format, year-month-day
  },
};

export default config;
