import { getDistance } from "geolib";
import GPX from "gpx-parser-builder";
import dayjs from "dayjs";

async function getRunName(path: string) {
  let obj = GPX.parse(await Bun.file(path).text());
  return obj.trk[0].name;
}

async function findAvgPace(path: string) {
  let isTemplate = false;

  let gpx = GPX.parse(await Bun.file(path).text());
  let totalDistance = 0;
  let totalTime = 0;

  let previousPoint = gpx.trk[0].trkseg[0].trkpt[0];
  for (let i = 0; i < gpx.trk[0].trkseg[0].trkpt.length; i++) {
    let el = gpx.trk[0].trkseg[0].trkpt[i];
    let distance = getDistance(
      { latitude: previousPoint.$.lat, longitude: previousPoint.$.lon },
      {
        latitude: el.$.lat,
        longitude: el.$.lon,
      }
    );

    if (!el.time) {
      isTemplate = true;
      return null;
    }
    let time = dayjs(el.time).diff(dayjs(previousPoint.time), "second");

    totalDistance += distance;
    totalTime += time;
    previousPoint = el;
  }

  let avgPace = totalTime / totalDistance;
  let minutes = Math.floor(avgPace / 60);
  let seconds = Math.floor(avgPace % 60);

  return `${minutes}:${seconds}`;
}

async function formatRun(
  path: string,
  startTime: string,
  speed: string,
  _name: string
) {
  let gpx = GPX.parse(await Bun.file(path).text());

  var pace = {
    seconds: function () {
      let fart = speed.split(":");
      return Number(fart[0]) * 60 + Number(fart[1]);
    },
    velocity: function () {
      return 1609 / this.seconds();
    },
  };

  if (!gpx.metadata) gpx.metadata = {};
  gpx.metadata.time = startTime;

  gpx.trk[0].name = _name;
  gpx.trk[0].trkseg[0].trkpt.forEach((el: any, index: number, arr: any) => {
    if (index === 0) {
      el.time = startTime;
    } else {
      let previousPoint = arr[index - 1];
      let distance = getDistance(
        { latitude: previousPoint.$.lat, longitude: previousPoint.$.lon },
        {
          latitude: el.$.lat,
          longitude: el.$.lon,
        }
      );

      let secs = Number(distance) / pace.velocity();
      el.time = dayjs(previousPoint.time).add(secs, "second").toISOString();
    }
  });

  return new GPX(gpx).toString();
}

export { formatRun, findAvgPace, getRunName };
