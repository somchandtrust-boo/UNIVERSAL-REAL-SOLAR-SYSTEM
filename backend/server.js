"use strict";

const express = require("express");
const cors = require("cors");

const app = express();

const PORT = process.env.PORT || 3000;

const JPL_API =
  "https://ssd.jpl.nasa.gov/api/horizons.api";

/* =========================================================
   CORS
   ========================================================= */

app.use(
  cors({
    origin: [
      "https://somchandtrust-boo.github.io",
      "http://localhost:3000",
      "http://localhost:5500",
      "http://127.0.0.1:5500"
    ]
  })
);

app.use(express.json());

/* =========================================================
   PLANET DATABASE
   ========================================================= */

const PLANETS = {
  mercury: {
    name: "Mercury",
    id: "199"
  },

  venus: {
    name: "Venus",
    id: "299"
  },

  earth: {
    name: "Earth",
    id: "399"
  },

  mars: {
    name: "Mars",
    id: "499"
  },

  jupiter: {
    name: "Jupiter",
    id: "599"
  },

  saturn: {
    name: "Saturn",
    id: "699"
  },

  uranus: {
    name: "Uranus",
    id: "799"
  },

  neptune: {
    name: "Neptune",
    id: "899"
  },

  moon: {
    name: "Moon",
    id: "301"
  }
};

/* =========================================================
   CACHE
   ========================================================= */

const cache = new Map();

const CACHE_TIME = 30000;


/* =========================================================
   HEALTH CHECK
   ========================================================= */

app.get("/", (req, res) => {

  res.json({
    status: "ONLINE",
    system: "UNIVERSAL REAL SOLAR SYSTEM",
    backend: "JPL HORIZONS PROXY",
    source: "NASA/JPL Horizons",
    time: new Date().toISOString()
  });

});


app.get("/health", (req, res) => {

  res.json({
    status: "healthy",
    service: "Universal Real Solar System Backend",
    jpl: "connected"
  });

});


/* =========================================================
   JPL REQUEST
   ========================================================= */

async function requestJPL(command, center) {

  const now = new Date();

  /*
     Horizons accepts calendar dates through TLIST.
     We use UTC time.
  */

  const isoTime =
    now.toISOString()
      .replace(".000Z", "Z");

  const params = new URLSearchParams({

    format: "json",

    COMMAND: `'${command}'`,

    OBJ_DATA: "NO",

    MAKE_EPHEM: "YES",

    EPHEM_TYPE: "VECTORS",

    CENTER: `'${center}'`,

    TLIST: `'${isoTime}'`,

    TLIST_TYPE: "CAL",

    REF_PLANE: "ECLIPTIC",

    REF_SYSTEM: "ICRF",

    OUT_UNITS: "AU-D",

    VEC_TABLE: "2",

    VEC_LABELS: "YES",

    CSV_FORMAT: "NO"

  });


  const url =
    `${JPL_API}?${params.toString()}`;


  const response =
    await fetch(url);


  if (!response.ok) {

    throw new Error(
      `JPL HTTP ${response.status}`
    );

  }


  const data =
    await response.json();


  if (data.error) {

    throw new Error(
      data.error
    );

  }


  if (!data.result) {

    throw new Error(
      "JPL returned no ephemeris result"
    );

  }


  return data;

}


/* =========================================================
   PARSE JPL VECTOR
   ========================================================= */

function parseVector(result) {

  const start =
    result.indexOf("$$SOE");

  const end =
    result.indexOf("$$EOE");


  if (
    start === -1 ||
    end === -1
  ) {

    throw new Error(
      "JPL vector block not found"
    );

  }


  const block =
    result
      .substring(
        start + 5,
        end
      )
      .trim();


  /*
     Expected order from VEC_TABLE=2:

     X
     Y
     Z
     VX
     VY
     VZ
  */


  const values =
    block
      .split(/\s+/)
      .map(Number)
      .filter(Number.isFinite);


  /*
     Find first six numeric state values.

     JPL output may contain the date
     before the vector values.
  */


  let vector = null;


  for (
    let i = 0;
    i <= values.length - 6;
    i++
  ) {

    const candidate =
      values.slice(i, i + 6);


    if (
      candidate.every(
        Number.isFinite
      )
    ) {

      /*
         Position values should be
         reasonable AU-scale numbers.
      */

      if (
        Math.abs(candidate[0]) < 100 &&
        Math.abs(candidate[1]) < 100 &&
        Math.abs(candidate[2]) < 100
      ) {

        vector = candidate;

        break;

      }

    }

  }


  if (!vector) {

    throw new Error(
      "Unable to parse JPL vector"
    );

  }


  return {

    x: vector[0],

    y: vector[1],

    z: vector[2],

    vx: vector[3],

    vy: vector[4],

    vz: vector[5]

  };

}


/* =========================================================
   VECTOR ENDPOINT
   ========================================================= */

app.get("/api/vector", async (req, res) => {

  try {

    const command =
      String(
        req.query.command || ""
      ).trim();


    const center =
      String(
        req.query.center || "500@10"
      ).trim();


    if (!command) {

      return res
        .status(400)
        .json({
          error:
            "Missing command"
        });

    }


    /*
       Security:
       only numeric Horizons body IDs
       are accepted here.
    */

    if (!/^\d+$/.test(command)) {

      return res
        .status(400)
        .json({
          error:
            "Invalid command"
        });

    }


    const cacheKey =
      `${command}_${center}`;


    const cached =
      cache.get(cacheKey);


    if (
      cached &&
      Date.now() - cached.time <
      CACHE_TIME
    ) {

      return res.json({

        success: true,

        cached: true,

        command,

        center,

        vector: cached.vector,

        timestamp:
          cached.timestamp

      });

    }


    const jplData =
      await requestJPL(
        command,
        center
      );


    const vector =
      parseVector(
        jplData.result
      );


    const timestamp =
      new Date().toISOString();


    cache.set(
      cacheKey,
      {
        time: Date.now(),
        timestamp,
        vector
      }
    );


    res.json({

      success: true,

      cached: false,

      source:
        "NASA/JPL Horizons",

      command,

      center,

      timestamp,

      vector

    });

  }

  catch (error) {

    console.error(
      "JPL ERROR:",
      error
    );


    res
      .status(500)
      .json({

        success: false,

        error:
          error.message ||
          "JPL request failed"

      });

  }

});


/* =========================================================
   SOLAR SYSTEM ENDPOINT
   ========================================================= */

app.get(
  "/api/solar-system",
  async (req, res) => {

    try {

      const result = {};

      /*
         Planetary bodies:
         Sun is not requested because
         it is the coordinate origin.

         Planets use heliocentric center.
      */

      const planetNames = [
        "mercury",
        "venus",
        "earth",
        "mars",
        "jupiter",
        "saturn",
        "uranus",
        "neptune"
      ];


      for (
        const name of planetNames
      ) {

        const planet =
          PLANETS[name];


        try {

          const jplData =
            await requestJPL(
              planet.id,
              "500@10"
            );


          const vector =
            parseVector(
              jplData.result
            );


          result[name] = {

            name:
              planet.name,

            id:
              planet.id,

            vector

          };

        }

        catch (error) {

          result[name] = {

            name:
              planet.name,

            id:
              planet.id,

            error:
              error.message

          };

        }

      }


      /*
         Moon relative to Earth.
      */

      try {

        const moonData =
          await requestJPL(
            PLANETS.moon.id,
            "500@399"
          );


        result.moon = {

          name: "Moon",

          id: PLANETS.moon.id,

          center: "Earth",

          vector:
            parseVector(
              moonData.result
            )

        };

      }

      catch (error) {

        result.moon = {

          name: "Moon",

          id: PLANETS.moon.id,

          error:
            error.message

        };

      }


      res.json({

        success: true,

        source:
          "NASA/JPL Horizons",

        timestamp:
          new Date().toISOString(),

        bodies:
          result

      });

    }

    catch (error) {

      console.error(
        "SOLAR SYSTEM ERROR:",
        error
      );


      res
        .status(500)
        .json({

          success: false,

          error:
            error.message

        });

    }

  }
);


/* =========================================================
   UNKNOWN ROUTE
   ========================================================= */

app.use(
  (req, res) => {

    res
      .status(404)
      .json({

        error:
          "Endpoint not found"

      });

  }
);


/* =========================================================
   START SERVER
   ========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      "======================================"
    );

    console.log(
      "UNIVERSAL REAL SOLAR SYSTEM BACKEND"
    );

    console.log(
      "======================================"
    );

    console.log(
      `Server running on port ${PORT}`
    );

    console.log(
      "JPL Horizons: ONLINE"
    );

  }
);
