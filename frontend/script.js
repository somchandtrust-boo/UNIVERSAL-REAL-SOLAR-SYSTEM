/* =========================================================
   UNIVERSAL REAL SOLAR SYSTEM
   FIXED PART 8
   NASA / JPL HORIZONS + THREE.JS
   ========================================================= */

"use strict";

import * as THREE from "three";

import {
    OrbitControls
} from "three/addons/controls/OrbitControls.js";


/* =========================================================
   JPL API
   ========================================================= */

const JPL_API =
    "https://ssd.jpl.nasa.gov/api/horizons.api";


/* =========================================================
   PLANETS
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
        radius: 1.00,
        color: 0x3188ff
    },

    Mars: {
        id: "499",
        radius: 0.53,
        color: 0xd75c3c
    },

    Jupiter: {
        id: "599",
        radius: 2.40,
        color: 0xc99a6b
    },

    Saturn: {
        id: "699",
        radius: 2.00,
        color: 0xd8c49c
    },

    Uranus: {
        id: "799",
        radius: 1.55,
        color: 0x7ed9df
    },

    Neptune: {
        id: "899",
        radius: 1.50,
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

const AU_SCALE = 70;

const PLANET_VISUAL_SCALE = 1.8;


/* =========================================================
   THREE VARIABLES
   ========================================================= */

let scene = null;

let camera = null;

let renderer = null;

let controls = null;


/* =========================================================
   OBJECT STORAGE
   ========================================================= */

const planetMeshes = {};

const planetLabels = {};

const planetData = {};

let moonMesh = null;

let moonLabel = null;

let sunMesh = null;

let earthMoonLine = null;

let orbitGroup = null;


/* =========================================================
   SETTINGS
   ========================================================= */

let orbitsVisible = true;

let labelsVisible = true;


/* =========================================================
   DOM
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
   TIME
   ========================================================= */

function getJPLDate() {

    return new Date().toISOString();

}


function updateClock() {

    if (!currentTime) return;

    const now = new Date();

    currentTime.textContent =
        now.toISOString()
        .replace("T", " ")
        .replace("Z", " UTC");

}


updateClock();

setInterval(
    updateClock,
    1000
);


/* =========================================================
   INITIALIZE THREE.JS
   ========================================================= */

function initScene() {

    scene =
        new THREE.Scene();


    scene.background =
        new THREE.Color(
            0x02040a
        );


    /* -----------------------------------------------------
       CAMERA
       ----------------------------------------------------- */

    camera =
        new THREE.PerspectiveCamera(

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

            powerPreference:
                "high-performance"

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


    const container =
        document.getElementById(
            "solar-system"
        );


    container.appendChild(
        renderer.domElement
    );


    /* -----------------------------------------------------
       ORBIT CONTROLS
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
       LIGHT
       ----------------------------------------------------- */

    const ambientLight =
        new THREE.AmbientLight(

            0xffffff,
            0.18

        );


    scene.add(
        ambientLight
    );


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


    scene.add(
        sunLight
    );


    /* -----------------------------------------------------
       STARS
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


    scene.add(
        orbitGroup
    );


    /* -----------------------------------------------------
       RESIZE
       ----------------------------------------------------- */

    window.addEventListener(

        "resize",
        onWindowResize

    );


    /*
       IMPORTANT FIX:

       renderer exists now.

       Therefore click handler is attached
       ONLY AFTER renderer creation.
    */

    setupClickHandler();

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


    scene.add(
        stars
    );

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


    sunMesh.name =
        "Sun";


    sunMesh.userData.objectName =
        "Sun";


    scene.add(
        sunMesh
    );


    /* -----------------------------------------------------
       GLOW
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


    sunMesh.add(
        glow
    );


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


    mesh.name =
        name;


    mesh.userData.objectName =
        name;


    scene.add(
        mesh
    );


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


    moonMesh.name =
        "Moon";


    moonMesh.userData.objectName =
        "Moon";


    scene.add(
        moonMesh
    );


    createLabel(

        moonMesh,

        "MOON"

    );

}


/* =========================================================
   LABEL
   ========================================================= */

function createLabel(

    object,
    text

) {

    const canvas =
        document.createElement(
            "canvas"
        );


    canvas.width = 512;

    canvas.height = 128;


    const ctx =
        canvas.getContext(
            "2d"
        );


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


    object.add(
        sprite
    );


    if (
        text === "MOON"
    ) {

        moonLabel =
            sprite;

    } else {

        planetLabels[text] =
            sprite;

    }

}


/* =========================================================
   BUILD OBJECTS
   ========================================================= */

function buildObjects() {

    Object.entries(
        PLANETS
    ).forEach(

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
   JPL URL
   ========================================================= */

function buildJPLURL(

    command,
    center

) {

    const params =
        new URLSearchParams({

            format: "json",

            COMMAND:
                `'${command}'`,

            OBJ_DATA:
                "NO",

            MAKE_EPHEM:
                "YES",

            EPHEM_TYPE:
                "VECTORS",

            CENTER:
                `'${center}'`,

            TLIST:
                `'${getJPLDate()}'`,

            TLIST_TYPE:
                "CAL",

            REF_PLANE:
                "ECLIPTIC",

            REF_SYSTEM:
                "ICRF",

            OUT_UNITS:
                "AU-D",

            VEC_TABLE:
                "2",

            VEC_LABELS:
                "YES",

            CSV_FORMAT:
                "NO"

        });


    return (

        JPL_API +
        "?" +
        params.toString()

    );

}


/* =========================================================
   FETCH JPL
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

            "JPL HTTP " +
            response.status

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
            "JPL returned no result."
        );

    }


    return parseJPLVector(
        data.result
    );

}


/* =========================================================
   PARSE VECTOR
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
            "JPL vector block missing."
        );

    }


    const block =
        result.substring(
            soe,
            eoe
        );


    const getValue =
        (key) => {

            const regex =
                new RegExp(

                    key +
                    "\\s*=\\s*" +
                    "([+-]?" +
                    "\\d+(?:\\.\\d+)?" +
                    "(?:E[+-]?\\d+)?)",

                    "i"

                );


            const match =
                block.match(
                    regex
                );


            return match
                ? Number(match[1])
                : null;

        };


    const x =
        getValue("X");

    const y =
        getValue("Y");

    const z =
        getValue("Z");

    const vx =
        getValue("VX");

    const vy =
        getValue("VY");

    const vz =
        getValue("VZ");


    if (
        x === null ||
        y === null ||
        z === null
    ) {

        throw new Error(
            "Could not read JPL XYZ."
        );

    }


    return {

        x,
        y,
        z,

        vx:
            vx ?? 0,

        vy:
            vy ?? 0,

        vz:
            vz ?? 0

    };

}


/* =========================================================
   JPL → THREE
   ========================================================= */

function jplToThree(
    vector
) {

    return new THREE.Vector3(

        vector.x *
        AU_SCALE,

        vector.z *
        AU_SCALE,

        -vector.y *
        AU_SCALE

    );

}


/* =========================================================
   LOAD PLANET
   ========================================================= */

async function loadPlanet(

    name,
    config

) {

    loadingText.textContent =
        "Loading " +
        name +
        " from JPL Horizons...";


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


    planetMeshes[name]
        .userData.jplVector =
        vector;

}


/* =========================================================
   LOAD MOON
   ========================================================= */

async function loadMoon() {

    loadingText.textContent =
        "Loading Moon from JPL Horizons...";


    const vector =
        await fetchJPL(

            MOON.id,

            "500@399"

        );


    const moonRelative =
        jplToThree(
            vector
        );


    if (
        !planetMeshes.Earth
    ) {

        throw new Error(
            "Earth not loaded."
        );

    }


    moonMesh.position.copy(

        planetMeshes.Earth
            .position
            .clone()
            .add(
                moonRelative
            )

    );


    moonMesh.userData.jplVector =
        vector;


    createEarthMoonLine();

}


/* =========================================================
   EARTH → MOON LINE
   ========================================================= */

function createEarthMoonLine() {

    if (earthMoonLine) {

        scene.remove(
            earthMoonLine
        );

    }


    const points = [

        planetMeshes.Earth
            .position
            .clone(),

        moonMesh
            .position
            .clone()

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
   ORBIT GUIDES
   ========================================================= */

function buildOrbitGuides() {

    while (
        orbitGroup.children.length
    ) {

        const child =
            orbitGroup.children.pop();


        if (child.geometry) {

            child.geometry.dispose();

        }


        if (child.material) {

            child.material.dispose();

        }

    }


    Object.keys(
        PLANETS
    ).forEach(

        name => {

            const mesh =
                planetMeshes[name];


            if (!mesh)
                return;


            const radius =
                mesh.position.length();


            if (radius < 1)
                return;


            const points = [];


            for (
                let i = 0;
                i <= 256;
                i++
            ) {

                const angle =
                    i /
                    256 *
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


            orbitGroup.add(
                line
            );

        }

    );

}


/* =========================================================
   OBJECT INFORMATION
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


    if (!title || !data)
        return;


    if (
        name === "Sun"
    ) {

        title.textContent =
            "SUN";


        data.innerHTML =
            `
            Central Star<br>
            JPL Solar System Reference
            `;


        return;

    }


    if (
        name === "Moon"
    ) {

        const vector =
            moonMesh
                ?.userData
                ?.jplVector;


        if (!vector)
            return;


        title.textContent =
            "MOON";


        data.innerHTML =
            `
            JPL ID: 301<br>
            Reference: Earth Geocenter<br><br>

            POSITION<br>

            X: ${vector.x.toFixed(8)} AU<br>
            Y: ${vector.y.toFixed(8)} AU<br>
            Z: ${vector.z.toFixed(8)} AU<br><br>

            VELOCITY<br>

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
   CLICK HANDLER
   ========================================================= */

function setupClickHandler() {

    /*
       SAFETY CHECK

       This function is called only after
       renderer has been created.
    */

    if (!renderer) {

        console.error(
            "Renderer is not initialized."
        );

        return;

    }


    const raycaster =
        new THREE.Raycaster();


    const mouse =
        new THREE.Vector2();


    renderer.domElement.addEventListener(

        "pointerdown",

        function(event) {

            const rect =
                renderer
                    .domElement
                    .getBoundingClientRect();


            mouse.x =
                (
                    (
                        event.clientX -
                        rect.left
                    ) /
                    rect.width
                ) *
                2 -
                1;


            mouse.y =
                -(
                    (
                        event.clientY -
                        rect.top
                    ) /
                    rect.height
                ) *
                2 +
                1;


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
                    objects,
                    false
                );


            if (
                hits.length === 0
            ) {

                return;

            }


            const object =
                hits[0].object;


            const name =
                object.userData.objectName ||
                object.name;


            showObjectInfo(
                name
            );

        }

    );

}


/* =========================================================
   RESET VIEW
   ========================================================= */

document
    .getElementById("resetView")
    ?.addEventListener(

        "click",

        function() {

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
   ORBITS
   ========================================================= */

document
    .getElementById("toggleOrbits")
    ?.addEventListener(

        "click",

        function() {

            orbitsVisible =
                !orbitsVisible;


            orbitGroup.visible =
                orbitsVisible;

        }

    );


/* =========================================================
   LABELS
   ========================================================= */

document
    .getElementById("toggleLabels")
    ?.addEventListener(

        "click",

        function() {

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
   REAL TIME
   ========================================================= */

document
    .getElementById("realTime")
    ?.addEventListener(

        "click",

        async function() {

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


    if (
        earthMoonLine &&
        planetMeshes.Earth &&
        moonMesh
    ) {

        const positions =
            earthMoonLine
                .geometry
                .attributes
                .position
                .array;


        positions[0] =
            planetMeshes.Earth
                .position.x;

        positions[1] =
            planetMeshes.Earth
                .position.y;

        positions[2] =
            planetMeshes.Earth
                .position.z;


        positions[3] =
            moonMesh.position.x;

        positions[4] =
            moonMesh.position.y;

        positions[5] =
            moonMesh.position.z;


        earthMoonLine
            .geometry
            .attributes
            .position
            .needsUpdate =
            true;

    }


    if (controls) {

        controls.update();

    }


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   LOAD COMPLETE SYSTEM
   ========================================================= */

async function loadRealSolarSystem() {

    loadingElement.style.display =
        "flex";


    jplStatus.textContent =
        "CONNECTING TO JPL HORIZONS";


    try {

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


        await loadMoon();


        buildOrbitGuides();


        jplStatus.textContent =
            "JPL HORIZONS • LIVE DATA";


        jplStatus.style.color =
            "#55ff99";


        loadingText.textContent =
            "REAL JPL DATA LOADED";


        setTimeout(

            function() {

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
            "JPL CONNECTION ERROR";


        jplStatus.style.color =
            "#ff4d6d";


        loadingText.textContent =
            "JPL DATA ERROR — CHECK CONSOLE";

    }

}


/* =========================================================
   RESIZE
   ========================================================= */

function onWindowResize() {

    if (
        !camera ||
        !renderer
    ) return;


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
   START
   ========================================================= */

initScene();

buildObjects();

animate();

loadRealSolarSystem();
