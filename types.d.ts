type RunType = "longrun" | "workout" | "breakday" | "premeet";

export interface Schedule {
  monday: RunType;
  tuesday: RunType;
  wednesday: RunType;
  thursday: RunType;
  friday: RunType;
  [key: string]: string;
}
