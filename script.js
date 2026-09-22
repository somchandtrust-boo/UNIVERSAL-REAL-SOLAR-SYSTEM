/* =========================================================
   UNIVERSAL REAL SOLAR SYSTEM
   PART 8
   REAL JPL HORIZONS VECTOR ENGINE

   Data:
   NASA/JPL Horizons

   Features:
   - Real planetary vectors
   - Real Earth position
   - Real Moon position
   - Real velocity vectors
   - Real UTC time
   - Three.js 3D
   - OrbitControls
   ========================================================= */

"use strict";


/* =========================================================
   THREE.JS IMPORTS
   ========================================================= */

import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";


/* =========================================================
   JPL HORIZONS API
   ========================================================= */

const JPL_API =
    "https://ssd.jpl.nasa.gov/api/horizons.api";


/* =========================================================
   SOLAR SYSTEM OBJECTS
   ========================================================= */

const PLANETS = {

    Mercury: {
        id: "199",
        radius: 0.38,
        color: 0x9b8c7a
    },

    Venus: {
        id: "299",
        radius: 0.95,
        color: 0xd9b36c
    },

    Earth: {
        id: "399",
        radius: 1.0,
        color: 0x3d8cff
    },

    Mars: {
        id: "499",
        radius: 0.53,
        color: 0xd75c3c
    },

    Jupiter: {
        id: "599",
        radius: 2.4,
        color: 0xc99a6b
    },

    Saturn: {
        id: "699",
        radius: 2.0,
        color: 0xd8c49c
    },

    Uranus: {
        id: "799",
        radius: 1.55,
        color: 0x7ed9df
    },

    Neptune: {
        id: "899",
        radius: 1.5,
        color: 0x4169e1
    }

};


/* =========================================================
   MOON
   ========================================================= */

const MOON = {

    id: "301",

    radius: 0.27,

    color: 0xbdbdbd

};


/* =========================================================
   VISUAL SCALE
   ========================================================= */

/*
   IMPORTANT:

   Real solar-system distances are enormous.

   Therefore this is a visualization scale.

   The DATA remains real.
   Only the visual size is enlarged.
*/

const AU_SCALE = 70;


/* =========================================================
   PLANET VISUAL SIZE
   ========================================================= */

const PLANET_VISUAL_SCALE = 1.8;


/* =========================================================
   THREE VARIABLES
   ========================================================= */

let scene;
let camera;
let renderer;
let controls;


/* =========================================================
   OBJECT STORAGE
   ========================================================= */

const planetMeshes = {};

const planetLabels = {};

const planetData = {};

let moonMesh = null;

let moonLabel = null;

let earthMoonLine = null;


/* =========================================================
   SUN
   ========================================================= */

let sunMesh;


/* =========================================================
   ORBITS
   ========================================================= */

let orbitGroup;

let orbitsVisible = true;

let labelsVisible = true;


/* =========================================================
   LOADING
   ========================================================= */

const loadingElement =
    document.getElementById("loading");

const loadingText =
    document.getElementById("loading-text");

const jplStatus =
    document.getElementById("jplStatus");

const currentTime =
    document.getElementById("current-time");


/* =========================================================
   CURRENT JPL TIME
   ========================================================= */

function getJPLDate() {

    const now = new Date();

    return now.toISOString();

}


/* =========================================================
   UPDATE TIME DISPLAY
   ========================================================= */

function updateClock() {

    const now = new Date();

    const utc =
        now.toISOString()
           .replace("T", " ")
           .replace("Z", " UTC");

    currentTime.textContent = utc;

}

updateClock();

setInterval(updateClock, 1000);


/* =========================================================
   SCENE INITIALIZATION
   ========================================================= */

function initScene() {

    scene = new THREE.Scene();

    scene.background =
        new THREE.Color(0x02040a);


    /* -----------------------------------------------------
       CAMERA
       ----------------------------------------------------- */

    camera = new THREE.PerspectiveCamera(

        50,

        window.innerWidth /
        window.innerHeight,

        0.1,

        100000

    );


    camera.position.set(

        0,

        450,

        900

    );


    /* -----------------------------------------------------
       RENDERER
       ----------------------------------------------------- */

    renderer =
        new THREE.WebGLRenderer({

            antialias: true,

            powerPreference: "high-performance"

        });


    renderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            2
        )

    );


    renderer.setSize(

        window.innerWidth,
        window.innerHeight

    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    document
        .getElementById("solar-system")
        .appendChild(renderer.domElement);


    /* -----------------------------------------------------
       CONTROLS
       ----------------------------------------------------- */

    controls =
        new OrbitControls(

            camera,
            renderer.domElement

        );


    controls.enableDamping = true;

    controls.dampingFactor = 0.05;

    controls.minDistance = 20;

    controls.maxDistance = 10000;

    controls.target.set(
        0,
        0,
        0
    );


    /* -----------------------------------------------------
       LIGHTING
       ----------------------------------------------------- */

    const ambientLight =
        new THREE.AmbientLight(

            0xffffff,
            0.18

        );

    scene.add(ambientLight);


    const sunLight =
        new THREE.PointLight(

            0xffffff,
            4,
            0

        );

    sunLight.position.set(
        0,
        0,
        0
    );

    scene.add(sunLight);


    /* -----------------------------------------------------
       STAR FIELD
       ----------------------------------------------------- */

    createStarField();


    /* -----------------------------------------------------
       SUN
       ----------------------------------------------------- */

    createSun();


    /* -----------------------------------------------------
       ORBIT GROUP
       ----------------------------------------------------- */

    orbitGroup =
        new THREE.Group();

    scene.add(orbitGroup);


    /* -----------------------------------------------------
       RESIZE
       ----------------------------------------------------- */

    window.addEventListener(

        "resize",
        onWindowResize

    );

}


/* =========================================================
   STAR FIELD
   ========================================================= */

function createStarField() {

    const starCount = 12000;

    const positions =
        new Float32Array(
            starCount * 3
        );


    for (
        let i = 0;
        i < starCount;
        i++
    ) {

        const radius =
            3000 +
            Math.random() * 5000;


        const theta =
            Math.random() *
            Math.PI * 2;


        const phi =
            Math.acos(

                2 * Math.random() - 1

            );


        positions[i * 3] =
            radius *
            Math.sin(phi) *
            Math.cos(theta);


        positions[i * 3 + 1] =
            radius *
            Math.sin(phi) *
            Math.sin(theta);


        positions[i * 3 + 2] =
            radius *
            Math.cos(phi);

    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(

        "position",

        new THREE.BufferAttribute(

            positions,
            3

        )

    );


    const material =
        new THREE.PointsMaterial({

            color: 0xffffff,

            size: 1.4,

            sizeAttenuation: true

        });


    const stars =
        new THREE.Points(

            geometry,
            material

        );


    scene.add(stars);

}


/* =========================================================
   SUN
   ========================================================= */

function createSun() {

    const geometry =
        new THREE.SphereGeometry(

            15,

            64,
            64

        );


    const material =
        new THREE.MeshBasicMaterial({

            color: 0xffb300

        });


    sunMesh =
        new THREE.Mesh(

            geometry,
            material

        );


    sunMesh.name = "Sun";

    scene.add(sunMesh);


    /* -----------------------------------------------------
       SUN GLOW
       ----------------------------------------------------- */

    const glowGeometry =
        new THREE.SphereGeometry(

            22,

            32,
            32

        );


    const glowMaterial =
        new THREE.MeshBasicMaterial({

            color: 0xff8c00,

            transparent: true,

            opacity: 0.12,

            side: THREE.BackSide

        });


    const glow =
        new THREE.Mesh(

            glowGeometry,
            glowMaterial

        );


    sunMesh.add(glow);


    createLabel(

        sunMesh,

        "SUN"

    );

}


/* =========================================================
   CREATE PLANET
   ========================================================= */

function createPlanet(

    name,
    config

) {

    const geometry =
        new THREE.SphereGeometry(

            config.radius *
            PLANET_VISUAL_SCALE,

            48,
            48

        );


    const material =
        new THREE.MeshStandardMaterial({

            color: config.color,

            roughness: 0.8,

            metalness: 0.05

        });


    const mesh =
        new THREE.Mesh(

            geometry,
            material

        );


    mesh.name = name;

    mesh.userData.objectName =
        name;

    scene.add(mesh);


    planetMeshes[name] =
        mesh;


    createLabel(

        mesh,

        name.toUpperCase()

    );

}


/* =========================================================
   CREATE MOON
   ========================================================= */

function createMoon() {

    const geometry =
        new THREE.SphereGeometry(

            MOON.radius *
            PLANET_VISUAL_SCALE,

            40,
            40

        );


    const material =
        new THREE.MeshStandardMaterial({

            color: MOON.color,

            roughness: 0.95

        });


    moonMesh =
        new THREE.Mesh(

            geometry,
            material

        );


    moonMesh.name = "Moon";

    moonMesh.userData.objectName =
        "Moon";


    scene.add(moonMesh);


    createLabel(

        moonMesh,

        "MOON"

    );

}


/* =========================================================
   LABEL SYSTEM
   ========================================================= */

function createLabel(

    object,
    text

) {

    const canvas =
        document.createElement("canvas");


    canvas.width = 512;

    canvas.height = 128;


    const ctx =
        canvas.getContext("2d");


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.font =
        "bold 42px Arial";


    ctx.fillStyle =
        "#ffffff";


    ctx.textAlign =
        "center";


    ctx.textBaseline =
        "middle";


    ctx.fillText(

        text,

        canvas.width / 2,

        canvas.height / 2

    );


    const texture =
        new THREE.CanvasTexture(

            canvas

        );


    texture.colorSpace =
        THREE.SRGBColorSpace;


    const material =
        new THREE.SpriteMaterial({

            map: texture,

            transparent: true,

            depthTest: false

        });


    const sprite =
        new THREE.Sprite(

            material

        );


    sprite.scale.set(

        45,
        11,
        1

    );


    sprite.position.y = 5;


    object.add(sprite);


    if (text === "MOON") {

        moonLabel = sprite;

    } else {

        planetLabels[text] =
            sprite;

    }

}


/* =========================================================
   BUILD PLANETS
   ========================================================= */

function buildObjects() {

    Object.entries(PLANETS)
        .forEach(

            ([name, config]) => {

                createPlanet(
                    name,
                    config
                );

            }

        );


    createMoon();

}


/* =========================================================
   BUILD JPL QUERY
   ========================================================= */

function buildJPLURL(

    command,
    center

) {

    const params =
        new URLSearchParams({

            format: "json",

            COMMAND: `'${command}'`,

            OBJ_DATA: "NO",

            MAKE_EPHEM: "YES",

            EPHEM_TYPE: "VECTORS",

            CENTER: `'${center}'`,

            TLIST: `'${getJPLDate()}'`,

            TLIST_TYPE: "CAL",

            REF_PLANE: "ECLIPTIC",

            REF_SYSTEM: "ICRF",

            OUT_UNITS: "AU-D",

            VEC_TABLE: "2",

            VEC_LABELS: "YES",

            CSV_FORMAT: "NO"

        });


    return `${JPL_API}?${params.toString()}`;

}


/* =========================================================
   FETCH JPL DATA
   ========================================================= */

async function fetchJPL(

    command,
    center

) {

    const url =
        buildJPLURL(

            command,
            center

        );


    const response =
        await fetch(

            url,

            {
                method: "GET",

                cache: "no-store"

            }

        );


    if (!response.ok) {

        throw new Error(

            `JPL HTTP ${response.status}`

        );

    }


    const data =
        await response.json();


    if (
        data.error
    ) {

        throw new Error(

            data.error

        );

    }


    if (
        !data.result
    ) {

        throw new Error(

            "JPL returned no ephemeris result."

        );

    }


    return parseJPLVector(

        data.result

    );

}


/* =========================================================
   PARSE JPL VECTOR
   ========================================================= */

function parseJPLVector(

    result

) {

    const soe =
        result.indexOf(
            "$$SOE"
        );


    const eoe =
        result.indexOf(
            "$$EOE"
        );


    if (
        soe === -1 ||
        eoe === -1
    ) {

        throw new Error(

            "JPL vector block not found."

        );

    }


    const block =
        result.substring(

            soe,
            eoe

        );


    /*
       Horizons VECTORS output contains:

       X =
       Y =
       Z =

       VX =
       VY =
       VZ =
    */


    const xMatch =
        block.match(

            /X\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    const yMatch =
        block.match(

            /Y\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    const zMatch =
        block.match(

            /Z\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    const vxMatch =
        block.match(

            /VX\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    const vyMatch =
        block.match(

            /VY\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    const vzMatch =
        block.match(

            /VZ\s*=\s*([+-]?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i

        );


    if (
        !xMatch ||
        !yMatch ||
        !zMatch
    ) {

        throw new Error(

            "Could not parse JPL XYZ vector."

        );

    }


    return {

        x: Number(xMatch[1]),

        y: Number(yMatch[1]),

        z: Number(zMatch[1]),

        vx:
            vxMatch
                ? Number(vxMatch[1])
                : 0,

        vy:
            vyMatch
                ? Number(vyMatch[1])
                : 0,

        vz:
            vzMatch
                ? Number(vzMatch[1])
                : 0

    };

}


/* =========================================================
   JPL → THREE COORDINATE CONVERSION
   ========================================================= */

function jplToThree(

    vector

) {

    /*
       JPL:
       X = ecliptic X
       Y = ecliptic Y
       Z = ecliptic Z

       Three.js:
       X = horizontal
       Y = vertical
       Z = depth
    */


    return new THREE.Vector3(

        vector.x * AU_SCALE,

        vector.z * AU_SCALE,

        -vector.y * AU_SCALE

    );

}


/* =========================================================
   LOAD PLANET DATA
   ========================================================= */

async function loadPlanet(

    name,
    config

) {

    loadingText.textContent =
        `Loading ${name} from JPL Horizons...`;


    const vector =
        await fetchJPL(

            config.id,

            "500@10"

        );


    planetData[name] =
        vector;


    const position =
        jplToThree(

            vector

        );


    planetMeshes[name]
        .position.copy(

            position

        );


    /*
       Store original vector
       for information panel.
    */


    planetMeshes[name]
        .userData.jplVector =
        vector;


    createRealOrbitMarker(

        name,
        position

    );

}


/* =========================================================
   LOAD MOON
   ========================================================= */

async function loadMoon() {

    loadingText.textContent =
        "Loading Moon relative to Earth...";


    /*
       Earth = 399

       Moon = 301

       CENTER = Earth geocenter
    */


    const vector =
        await fetchJPL(

            MOON.id,

            "500@399"

        );


    const earth =
        planetMeshes.Earth;


    const moonRelative =
        jplToThree(

            vector

        );


    moonMesh.position.copy(

        earth.position.clone()
            .add(

                moonRelative

            )

    );


    moonMesh.userData.jplVector =
        vector;


    /*
       Earth → Moon line
    */

    createEarthMoonLine();

}


/* =========================================================
   REAL POSITION MARKER
   ========================================================= */

function createRealOrbitMarker(

    name,
    position

) {

    /*
       This is NOT a fake orbit.

       It is a point showing the
       current JPL position.

       Full orbital tracks will be
       added in the next stage using
       multiple JPL ephemeris samples.
    */


    if (
        !planetMeshes[name]
    ) return;


    planetMeshes[name]
        .userData.realPosition =
        position.clone();

}


/* =========================================================
   EARTH-MOON LINE
   ========================================================= */

function createEarthMoonLine() {

    if (earthMoonLine) {

        scene.remove(
            earthMoonLine
        );

    }


    if (
        !planetMeshes.Earth ||
        !moonMesh
    ) return;


    const points = [

        planetMeshes.Earth.position.clone(),

        moonMesh.position.clone()

    ];


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(

                points

            );


    const material =
        new THREE.LineBasicMaterial({

            color: 0x5ee7ff,

            transparent: true,

            opacity: 0.35

        });


    earthMoonLine =
        new THREE.Line(

            geometry,
            material

        );


    scene.add(

        earthMoonLine

    );

}


/* =========================================================
   REAL ORBIT VISUALIZATION
   ========================================================= */

function buildOrbitGuides() {

    /*
       For now we create guide circles
       based on the current real distance.

       IMPORTANT:
       Planet POSITION is from JPL.

       Next stage:
       multiple JPL time samples will
       generate actual orbital curves.
    */


    while (
        orbitGroup.children.length
    ) {

        const child =
            orbitGroup.children.pop();

        child.geometry?.dispose();

        child.material?.dispose();

    }


    Object.keys(PLANETS)
        .forEach(

            name => {

                const mesh =
                    planetMeshes[name];


                if (!mesh)
                    return;


                const radius =
                    Math.sqrt(

                        mesh.position.x *
                        mesh.position.x +

                        mesh.position.y *
                        mesh.position.y +

                        mesh.position.z *
                        mesh.position.z

                    );


                if (
                    radius < 1
                ) return;


                const points = [];


                for (
                    let i = 0;
                    i <= 256;
                    i++
                ) {

                    const angle =
                        (i / 256) *
                        Math.PI *
                        2;


                    points.push(

                        new THREE.Vector3(

                            Math.cos(angle) *
                            radius,

                            0,

                            Math.sin(angle) *
                            radius

                        )

                    );

                }


                const geometry =
                    new THREE.BufferGeometry()
                        .setFromPoints(

                            points

                        );


                const material =
                    new THREE.LineBasicMaterial({

                        color: 0x1689a8,

                        transparent: true,

                        opacity: 0.28

                    });


                const line =
                    new THREE.LineLoop(

                        geometry,
                        material

                    );


                line.userData.guide =
                    true;


                orbitGroup.add(line);

            }

        );

}


/* =========================================================
   LOAD COMPLETE SOLAR SYSTEM
   ========================================================= */

async function loadRealSolarSystem() {

    loadingElement.style.display =
        "flex";


    jplStatus.textContent =
        "CONNECTING TO JPL HORIZONS";


    try {

        /*
           Clear old data
        */

        Object.keys(
            planetData
        ).forEach(

            key => {

                delete planetData[key];

            }

        );


        /*
           Load planets one by one.
        */

        for (
            const [
                name,
                config
            ]
            of Object.entries(PLANETS)
        ) {

            await loadPlanet(

                name,
                config

            );

        }


        /*
           Moon
        */

        await loadMoon();


        /*
           Build visual orbit guides
        */

        buildOrbitGuides();


        /*
           SUCCESS
        */

        jplStatus.textContent =
            "JPL HORIZONS • LIVE DATA";


        jplStatus.style.color =
            "#55ff99";


        loadingText.textContent =
            "REAL JPL SOLAR SYSTEM LOADED";


        setTimeout(

            () => {

                loadingElement.style.display =
                    "none";

            },

            700

        );


    } catch (error) {

        console.error(

            "JPL ERROR:",
            error

        );


        jplStatus.textContent =
            "JPL DATA ERROR";


        jplStatus.style.color =
            "#ff4d6d";


        loadingText.textContent =
            "JPL CONNECTION ERROR — CHECK BROWSER CONSOLE";


        /*
           Keep loading panel visible
           so user knows the real data
           did not load.
        */

    }

}


/* =========================================================
   PLANET INFORMATION
   ========================================================= */

function showObjectInfo(

    name

) {

    const title =
        document.getElementById(
            "selected-name"
        );


    const data =
        document.getElementById(
            "selected-data"
        );


    if (
        name === "Sun"
    ) {

        title.textContent =
            "SUN";


        data.innerHTML =

            `
            Central star<br>
            Reference origin: JPL Solar System
            `;


        return;

    }


    if (
        name === "Moon"
    ) {

        const vector =
            moonMesh.userData.jplVector;


        title.textContent =
            "MOON";


        data.innerHTML =

            `
            JPL ID: 301<br>
            Reference: Earth Geocenter<br><br>

            X: ${vector.x.toFixed(8)} AU<br>
            Y: ${vector.y.toFixed(8)} AU<br>
            Z: ${vector.z.toFixed(8)} AU<br><br>

            VX: ${vector.vx.toFixed(8)} AU/day<br>
            VY: ${vector.vy.toFixed(8)} AU/day<br>
            VZ: ${vector.vz.toFixed(8)} AU/day
            `;


        return;

    }


    const vector =
        planetData[name];


    if (!vector)
        return;


    title.textContent =
        name.toUpperCase();


    data.innerHTML =

        `
        JPL ID: ${PLANETS[name].id}<br><br>

        POSITION<br>
        X: ${vector.x.toFixed(8)} AU<br>
        Y: ${vector.y.toFixed(8)} AU<br>
        Z: ${vector.z.toFixed(8)} AU<br><br>

        VELOCITY<br>
        VX: ${vector.vx.toFixed(8)} AU/day<br>
        VY: ${vector.vy.toFixed(8)} AU/day<br>
        VZ: ${vector.vz.toFixed(8)} AU/day
        `;

}


/* =========================================================
   CLICK DETECTION
   ========================================================= */

const raycaster =
    new THREE.Raycaster();


const mouse =
    new THREE.Vector2();


rendererClickHandler();


function rendererClickHandler() {

    renderer.domElement.addEventListener(

        "pointerdown",

        event => {

            mouse.x =
                (
                    event.clientX /
                    window.innerWidth
                ) * 2 - 1;


            mouse.y =
                -(
                    event.clientY /
                    window.innerHeight
                ) * 2 + 1;


            raycaster.setFromCamera(

                mouse,
                camera

            );


            const objects = [

                sunMesh,

                ...Object.values(
                    planetMeshes
                ),

                moonMesh

            ].filter(Boolean);


            const hits =
                raycaster.intersectObjects(

                    objects

                );


            if (
                hits.length
            ) {

                const object =
                    hits[0].object;


                showObjectInfo(

                    object.userData.objectName ||
                    object.name

                );

            }

        }

    );

}


/* =========================================================
   RESET CAMERA
   ========================================================= */

document
    .getElementById("resetView")
    .addEventListener(

        "click",

        () => {

            camera.position.set(

                0,
                450,
                900

            );


            controls.target.set(

                0,
                0,
                0

            );


            controls.update();

        }

    );


/* =========================================================
   ORBIT TOGGLE
   ========================================================= */

document
    .getElementById("toggleOrbits")
    .addEventListener(

        "click",

        () => {

            orbitsVisible =
                !orbitsVisible;


            orbitGroup.visible =
                orbitsVisible;

        }

    );


/* =========================================================
   LABEL TOGGLE
   ========================================================= */

document
    .getElementById("toggleLabels")
    .addEventListener(

        "click",

        () => {

            labelsVisible =
                !labelsVisible;


            Object.values(
                planetLabels
            ).forEach(

                label => {

                    label.visible =
                        labelsVisible;

                }

            );


            if (moonLabel) {

                moonLabel.visible =
                    labelsVisible;

            }

        }

    );


/* =========================================================
   REAL TIME REFRESH
   ========================================================= */

document
    .getElementById("realTime")
    .addEventListener(

        "click",

        async () => {

            await loadRealSolarSystem();

        }

    );


/* =========================================================
   ANIMATION
   ========================================================= */

function animate() {

    requestAnimationFrame(

        animate

    );


    /*
       Planet rotation
    */

    Object.values(
        planetMeshes
    ).forEach(

        planet => {

            planet.rotation.y +=
                0.001;

        }

    );


    if (moonMesh) {

        moonMesh.rotation.y +=
            0.0015;

    }


    /*
       Update Earth-Moon connector
    */

    if (earthMoonLine) {

        const positions =
            earthMoonLine.geometry
                .attributes
                .position
                .array;


        positions[0] =
            planetMeshes.Earth.position.x;

        positions[1] =
            planetMeshes.Earth.position.y;

        positions[2] =
            planetMeshes.Earth.position.z;


        positions[3] =
            moonMesh.position.x;

        positions[4] =
            moonMesh.position.y;

        positions[5] =
            moonMesh.position.z;


        earthMoonLine.geometry
            .attributes
            .position
            .needsUpdate =
            true;

    }


    controls.update();


    renderer.render(

        scene,
        camera

    );

}


/* =========================================================
   RESIZE
   ========================================================= */

function onWindowResize() {

    camera.aspect =
        window.innerWidth /
        window.innerHeight;


    camera.updateProjectionMatrix();


    renderer.setSize(

        window.innerWidth,
        window.innerHeight

    );

}


/* =========================================================
   START SYSTEM
   ========================================================= */

initScene();

buildObjects();

animate();

loadRealSolarSystem();
