/* =========================================================
   UNIVERSAL REAL SOLAR SYSTEM
   PART 7
   JPL HORIZONS REAL DATA ENGINE
   ========================================================= */

"use strict";

/* =========================================================
   BASIC REFERENCES
========================================================= */

const container =
    document.getElementById("solar-system");

const infoPanel =
    document.getElementById("planet-info");

const loading =
    document.getElementById("loading");

const scene =
    new THREE.Scene();


/* =========================================================
   CAMERA
========================================================= */

const camera =
    new THREE.PerspectiveCamera(
        55,
        window.innerWidth /
        window.innerHeight,
        0.01,
        100000
    );

camera.position.set(
    0,
    180,
    420
);


/* =========================================================
   RENDERER
========================================================= */

const renderer =
    new THREE.WebGLRenderer({
        antialias: true
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

container.appendChild(
    renderer.domElement
);


/* =========================================================
   ORBIT CONTROLS
========================================================= */

const controls =
    new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;

controls.dampingFactor = 0.05;

controls.minDistance = 2;

controls.maxDistance = 3000;


/* =========================================================
   LIGHTING
========================================================= */

const ambient =
    new THREE.AmbientLight(
        0xffffff,
        0.08
    );

scene.add(ambient);


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


/* =========================================================
   STAR FIELD
========================================================= */

const starGeometry =
    new THREE.BufferGeometry();

const STAR_COUNT = 15000;

const starPositions =
    new Float32Array(
        STAR_COUNT * 3
    );

for (
    let i = 0;
    i < STAR_COUNT;
    i++
) {

    const r =
        1000 +
        Math.random() * 2500;

    const theta =
        Math.random() *
        Math.PI * 2;

    const phi =
        Math.acos(
            2 * Math.random() - 1
        );

    starPositions[i * 3] =
        r *
        Math.sin(phi) *
        Math.cos(theta);

    starPositions[i * 3 + 1] =
        r *
        Math.cos(phi);

    starPositions[i * 3 + 2] =
        r *
        Math.sin(phi) *
        Math.sin(theta);
}

starGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(
        starPositions,
        3
    )
);

const starMaterial =
    new THREE.PointsMaterial({
        color: 0xffffff,
        size: 1.2
    });

const stars =
    new THREE.Points(
        starGeometry,
        starMaterial
    );

scene.add(stars);


/* =========================================================
   SUN
========================================================= */

const sunGeometry =
    new THREE.SphereGeometry(
        18,
        64,
        64
    );

const sunMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xffc52e
    });

const sun =
    new THREE.Mesh(
        sunGeometry,
        sunMaterial
    );

scene.add(sun);


/* =========================================================
   SUN GLOW
========================================================= */

const glowGeometry =
    new THREE.SphereGeometry(
        24,
        64,
        64
    );

const glowMaterial =
    new THREE.MeshBasicMaterial({
        color: 0xff8c00,
        transparent: true,
        opacity: 0.13
    });

const sunGlow =
    new THREE.Mesh(
        glowGeometry,
        glowMaterial
    );

scene.add(
    sunGlow
);


/* =========================================================
   PLANET DATABASE
========================================================= */

/*
   Horizons major-body IDs

   Sun       = 10
   Mercury   = 199
   Venus     = 299
   Earth     = 399
   Mars      = 499
   Jupiter   = 599
   Saturn    = 699
   Uranus    = 799
   Neptune   = 899
*/

const PLANETS = [

    {
        name: "Mercury",
        id: "199",
        radius: 2.5,
        color: 0x8d8175
    },

    {
        name: "Venus",
        id: "299",
        radius: 4,
        color: 0xd6a866
    },

    {
        name: "Earth",
        id: "399",
        radius: 4.3,
        color: 0x2878d8
    },

    {
        name: "Mars",
        id: "499",
        radius: 3.2,
        color: 0xb94c32
    },

    {
        name: "Jupiter",
        id: "599",
        radius: 10,
        color: 0xc89a6d
    },

    {
        name: "Saturn",
        id: "699",
        radius: 8.5,
        color: 0xd6bd87
    },

    {
        name: "Uranus",
        id: "799",
        radius: 6.5,
        color: 0x72d5df
    },

    {
        name: "Neptune",
        id: "899",
        radius: 6.2,
        color: 0x365fd5
    }

];


/* =========================================================
   JPL API
========================================================= */

const JPL_API =
    "https://ssd.jpl.nasa.gov/api/horizons.api";


/* =========================================================
   DATE FORMAT
========================================================= */

function getJPLDate() {

    const now =
        new Date();

    return now.toISOString()
        .replace("T", " ")
        .replace("Z", "");

}


/* =========================================================
   GET REAL PLANET POSITION
========================================================= */

async function getPlanetPosition(
    planet
) {

    const date =
        getJPLDate();


    const params =
        new URLSearchParams({

            format: "json",

            COMMAND:
                `'${planet.id}'`,

            OBJ_DATA:
                "NO",

            MAKE_EPHEM:
                "YES",

            EPHEM_TYPE:
                "VECTORS",

            CENTER:
                "'500@10'",

            TLIST:
                `'${date}'`,

            TLIST_TYPE:
                "CAL",

            REF_PLANE:
                "ECLIPTIC",

            REF_SYSTEM:
                "ICRF",

            OUT_UNITS:
                "AU-D",

            VEC_TABLE:
                "1",

            VEC_LABELS:
                "YES",

            CSV_FORMAT:
                "NO"

        });


    const url =
        JPL_API +
        "?" +
        params.toString();


    const response =
        await fetch(
            url
        );


    if (!response.ok) {

        throw new Error(
            "JPL request failed"
        );

    }


    const data =
        await response.json();


    if (
        !data.result
    ) {

        throw new Error(
            "JPL returned no result"
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

    const start =
        result.indexOf(
            "$$SOE"
        );

    const end =
        result.indexOf(
            "$$EOE"
        );


    if (
        start === -1 ||
        end === -1
    ) {

        throw new Error(
            "JPL vector data not found"
        );

    }


    const block =
        result.substring(
            start + 5,
            end
        ).trim();


    const lines =
        block.split(
            "\n"
        );


    const numbers = [];


    for (
        const line of lines
    ) {

        const matches =
            line.match(
                /[-+]?\d+(?:\.\d+)?(?:[Ee][-+]?\d+)?/g
            );

        if (
            matches
        ) {

            matches.forEach(
                value => {

                    numbers.push(
                        Number(value)
                    );

                }
            );

        }

    }


    /*
       First values contain the
       requested epoch and XYZ data.

       We search for the last 3
       values in the first vector
       record when necessary.
    */

    if (
        numbers.length < 3
    ) {

        throw new Error(
            "Invalid JPL vector"
        );

    }


    /*
       Horizons VEC_TABLE=1 returns
       X, Y, Z position components.
    */

    const x =
        numbers[numbers.length - 3];

    const y =
        numbers[numbers.length - 2];

    const z =
        numbers[numbers.length - 1];


    return {
        x,
        y,
        z
    };

}


/* =========================================================
   SCALE
========================================================= */

/*
   1 AU is approximately represented
   by 70 visual units.

   Planet sizes are deliberately
   enlarged so they remain visible.
*/

const AU_SCALE = 70;


/* =========================================================
   PLANET OBJECTS
========================================================= */

const planetObjects = [];


/* =========================================================
   CREATE PLANET
========================================================= */

function createPlanet(
    data
) {

    const geometry =
        new THREE.SphereGeometry(
            data.radius,
            64,
            64
        );

    const material =
        new THREE.MeshStandardMaterial({
            color: data.color,
            roughness: 0.85,
            metalness: 0
        });

    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.userData =
        data;

    scene.add(
        mesh
    );


    /*
       Saturn rings
    */

    if (
        data.name === "Saturn"
    ) {

        const ringGeometry =
            new THREE.RingGeometry(
                data.radius * 1.35,
                data.radius * 2.15,
                128
            );

        const ringMaterial =
            new THREE.MeshBasicMaterial({

                color: 0xc4ae82,

                side:
                    THREE.DoubleSide,

                transparent:
                    true,

                opacity:
                    0.75

            });

        const rings =
            new THREE.Mesh(
                ringGeometry,
                ringMaterial
            );

        rings.rotation.x =
            Math.PI / 2.4;

        mesh.add(
            rings
        );
    }


    const object = {

        data,

        mesh,

        realPosition: {
            x: 0,
            y: 0,
            z: 0
        }

    };


    planetObjects.push(
        object
    );

    return object;
}


PLANETS.forEach(
    createPlanet
);


/* =========================================================
   APPLY REAL POSITION
========================================================= */

function applyRealPosition(
    object,
    position
) {

    object.realPosition =
        position;


    /*
       Horizons returns AU.

       Three.js scene uses a
       visualization scale.
    */

    object.mesh.position.set(

        position.x *
            AU_SCALE,

        position.z *
            AU_SCALE,

        -position.y *
            AU_SCALE

    );

}


/* =========================================================
   LOAD ALL PLANETS
========================================================= */

async function loadRealSolarSystem() {

    if (loading) {

        loading.style.display =
            "block";

    }


    let successful = 0;


    for (
        const object of planetObjects
    ) {

        try {

            const position =
                await getPlanetPosition(
                    object.data
                );


            applyRealPosition(
                object,
                position
            );


            successful++;


        }
        catch (error) {

            console.error(
                object.data.name,
                error
            );

        }

    }


    if (loading) {

        loading.style.opacity =
            "0";

        setTimeout(
            () => {

                loading.style.display =
                    "none";

            },
            500
        );

    }


    if (
        infoPanel
    ) {

        infoPanel.innerHTML = `

            <div class="info-title">
                SOLAR SYSTEM ONLINE
            </div>

            <div class="info-text">
                JPL Horizons data loaded
            </div>

            <div class="info-text">
                ${successful}/8 planets synchronized
            </div>

        `;

    }

}


/* =========================================================
   CLICK PLANET
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderer.domElement.addEventListener(
    "pointerdown",
    function(event) {

        mouse.x =
            event.clientX /
            window.innerWidth *
            2 - 1;

        mouse.y =
            -(event.clientY /
                window.innerHeight) *
            2 + 1;


        raycaster.setFromCamera(
            mouse,
            camera
        );


        const meshes =
            planetObjects.map(
                p => p.mesh
            );


        const hits =
            raycaster.intersectObjects(
                meshes,
                true
            );


        if (
            hits.length === 0
        ) {
            return;
        }


        let selected =
            hits[0].object;


        while (
            selected &&
            !selected.userData.name
        ) {

            selected =
                selected.parent;

        }


        if (
            !selected
        ) {
            return;
        }


        const data =
            selected.userData;


        const object =
            planetObjects.find(
                p =>
                    p.data.name ===
                    data.name
            );


        if (
            !object
        ) {
            return;
        }


        infoPanel.innerHTML = `

            <div class="info-title">
                ${data.name.toUpperCase()}
            </div>

            <div class="info-text">
                JPL ID: ${data.id}
            </div>

            <div class="info-text">
                X: ${object.realPosition.x.toFixed(6)} AU
            </div>

            <div class="info-text">
                Y: ${object.realPosition.y.toFixed(6)} AU
            </div>

            <div class="info-text">
                Z: ${object.realPosition.z.toFixed(6)} AU
            </div>

            <div class="info-text">
                POSITION: JPL HORIZONS
            </div>

        `;


        controls.target.copy(
            selected.position
        );

    }
);


/* =========================================================
   ORBIT VISUALIZATION
========================================================= */

let orbitVisible =
    true;

const orbitLines = [];


function createOrbitLine(
    object
) {

    const points = [];

    const radius =
        Math.sqrt(
            object.mesh.position.x *
            object.mesh.position.x +

            object.mesh.position.z *
            object.mesh.position.z
        );


    const segments =
        180;


    for (
        let i = 0;
        i <= segments;
        i++
    ) {

        const angle =
            i /
            segments *
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
            color: 0x31566d,
            transparent: true,
            opacity: 0.3
        });


    const line =
        new THREE.LineLoop(
            geometry,
            material
        );


    scene.add(
        line
    );


    orbitLines.push(
        line
    );

}


function rebuildOrbits() {

    orbitLines.forEach(
        line =>
            scene.remove(line)
    );


    orbitLines.length =
        0;


    planetObjects.forEach(
        createOrbitLine
    );

}


document
    .getElementById(
        "toggleOrbits"
    )
    .addEventListener(
        "click",
        function() {

            orbitVisible =
                !orbitVisible;


            orbitLines.forEach(
                line => {

                    line.visible =
                        orbitVisible;

                }
            );


            this.textContent =
                orbitVisible
                    ? "ORBITS"
                    : "ORBIT OFF";

        }
    );


/* =========================================================
   LABELS
========================================================= */

let labelsVisible =
    false;

const labels = [];


function makeLabel(
    name
) {

    const canvas =
        document.createElement(
            "canvas"
        );

    canvas.width =
        512;

    canvas.height =
        128;


    const ctx =
        canvas.getContext(
            "2d"
        );


    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 42px Arial";

    ctx.textAlign =
        "center";


    ctx.fillText(
        name,
        256,
        75
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.scale.set(
        25,
        6,
        1
    );


    sprite.visible =
        false;


    scene.add(
        sprite
    );


    labels.push(
        sprite
    );


    return sprite;
}


planetObjects.forEach(
    object => {

        object.label =
            makeLabel(
                object.data.name
            );

    }
);


document
    .getElementById(
        "toggleLabels"
    )
    .addEventListener(
        "click",
        function() {

            labelsVisible =
                !labelsVisible;


            labels.forEach(
                label => {

                    label.visible =
                        labelsVisible;

                }
            );


            this.textContent =
                labelsVisible
                    ? "LABELS ON"
                    : "LABELS";

        }
    );


/* =========================================================
   RESET
========================================================= */

document
    .getElementById(
        "resetView"
    )
    .addEventListener(
        "click",
        function() {

            camera.position.set(
                0,
                180,
                420
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
   REAL TIME REFRESH
========================================================= */

document
    .getElementById(
        "realTime"
    )
    .addEventListener(
        "click",
        async function() {

            this.textContent =
                "SYNCING...";

            await loadRealSolarSystem();

            rebuildOrbits();

            this.textContent =
                "REAL TIME";

        }
    );


/* =========================================================
   ANIMATION
========================================================= */

function animate() {

    requestAnimationFrame(
        animate
    );


    sun.rotation.y +=
        0.002;

    sunGlow.rotation.y -=
        0.001;


    stars.rotation.y +=
        0.0002;


    planetObjects.forEach(
        object => {

            object.mesh.rotation.y +=
                0.003;


            if (
                object.label
            ) {

                object.label.position.copy(
                    object.mesh.position
                );

                object.label.position.y +=
                    object.data.radius + 5;

            }

        }
    );


    controls.update();


    renderer.render(
        scene,
        camera
    );

}


/* =========================================================
   RESIZE
========================================================= */

window.addEventListener(
    "resize",
    function() {

        camera.aspect =
            window.innerWidth /
            window.innerHeight;


        camera.updateProjectionMatrix();


        renderer.setSize(
            window.innerWidth,
            window.innerHeight
        );

    }
);


/* =========================================================
   START
========================================================= */

animate();


loadRealSolarSystem()
    .then(() => {

        rebuildOrbits();

    });
