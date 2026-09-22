/* =========================================================
   UNIVERSAL REAL SOLAR SYSTEM
   PART 4 — REALISTIC PLANETS + EARTH + MOON
   ========================================================= */

"use strict";

const container = document.getElementById("solar-system");
const infoPanel = document.getElementById("planet-info");

const scene = new THREE.Scene();

/* =========================================================
   CAMERA
========================================================= */

const camera = new THREE.PerspectiveCamera(
    55,
    window.innerWidth / window.innerHeight,
    0.1,
    5000
);

camera.position.set(0, 180, 420);


/* =========================================================
   RENDERER
========================================================= */

const renderer = new THREE.WebGLRenderer({
    antialias: true
});

renderer.setPixelRatio(
    Math.min(window.devicePixelRatio, 2)
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
   CONTROLS
========================================================= */

const controls =
    new THREE.OrbitControls(
        camera,
        renderer.domElement
    );

controls.enableDamping = true;
controls.dampingFactor = 0.05;

controls.minDistance = 25;
controls.maxDistance = 1500;


/* =========================================================
   LIGHT
========================================================= */

const ambientLight =
    new THREE.AmbientLight(
        0xffffff,
        0.08
    );

scene.add(ambientLight);


const sunLight =
    new THREE.PointLight(
        0xffffff,
        3.5,
        0,
        1
    );

sunLight.position.set(
    0,
    0,
    0
);

scene.add(sunLight);


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
        color: 0xff8800,
        transparent: true,
        opacity: 0.14
    });

const sunGlow =
    new THREE.Mesh(
        glowGeometry,
        glowMaterial
    );

scene.add(sunGlow);


/* =========================================================
   STAR FIELD
========================================================= */

const starGeometry =
    new THREE.BufferGeometry();

const starCount = 14000;

const starPositions =
    new Float32Array(
        starCount * 3
    );

for (
    let i = 0;
    i < starCount;
    i++
) {

    const radius =
        700 +
        Math.random() * 1500;

    const theta =
        Math.random() *
        Math.PI * 2;

    const phi =
        Math.acos(
            2 * Math.random() - 1
        );

    starPositions[i * 3] =
        radius *
        Math.sin(phi) *
        Math.cos(theta);

    starPositions[i * 3 + 1] =
        radius *
        Math.cos(phi);

    starPositions[i * 3 + 2] =
        radius *
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
        size: 1.1
    });

const stars =
    new THREE.Points(
        starGeometry,
        starMaterial
    );

scene.add(stars);


/* =========================================================
   TEXTURE LOADER
========================================================= */

const textureLoader =
    new THREE.TextureLoader();


/*
   Public NASA-style texture URLs.
   If a texture is unavailable, the
   fallback color remains visible.
*/

const TEXTURES = {

    earth:
        "https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg",

    earthNormal:
        "https://threejs.org/examples/textures/planets/earth_normal_2048.jpg",

    earthSpecular:
        "https://threejs.org/examples/textures/planets/earth_specular_2048.jpg",

    moon:
        "https://threejs.org/examples/textures/planets/moon_1024.jpg",

    mars:
        "https://threejs.org/examples/textures/planets/mars_1k_color.jpg",

    mercury:
        "https://threejs.org/examples/textures/planets/mercury.jpg",

    venus:
        "https://threejs.org/examples/textures/planets/venus.jpg"
};


/* =========================================================
   PLANET DATA
========================================================= */

const planets = [

    {
        name: "Mercury",
        radius: 2.5,
        distance: 32,
        color: 0x8d8175,
        speed: 0.020,
        texture: TEXTURES.mercury,
        description:
            "The smallest planet and the closest planet to the Sun."
    },

    {
        name: "Venus",
        radius: 4,
        distance: 50,
        color: 0xd6a866,
        speed: 0.015,
        texture: TEXTURES.venus,
        description:
            "A hot terrestrial planet with a thick atmosphere."
    },

    {
        name: "Earth",
        radius: 4.3,
        distance: 70,
        color: 0x2778d8,
        speed: 0.010,
        texture: TEXTURES.earth,
        description:
            "Our home planet with liquid surface water and a life-supporting atmosphere."
    },

    {
        name: "Mars",
        radius: 3.2,
        distance: 90,
        color: 0xb94c32,
        speed: 0.008,
        texture: TEXTURES.mars,
        description:
            "The red planet with a thin carbon-dioxide atmosphere."
    },

    {
        name: "Jupiter",
        radius: 10,
        distance: 125,
        color: 0xc89a6d,
        speed: 0.004,
        description:
            "The largest planet in the Solar System."
    },

    {
        name: "Saturn",
        radius: 8.5,
        distance: 165,
        color: 0xd6bd87,
        speed: 0.003,
        description:
            "A gas giant surrounded by a spectacular ring system."
    },

    {
        name: "Uranus",
        radius: 6.5,
        distance: 205,
        color: 0x72d5df,
        speed: 0.002,
        description:
            "An ice giant rotating with an extreme axial tilt."
    },

    {
        name: "Neptune",
        radius: 6.2,
        distance: 245,
        color: 0x365fd5,
        speed: 0.0015,
        description:
            "A distant ice giant with extremely fast winds."
    }

];


/* =========================================================
   PLANET STORAGE
========================================================= */

const planetObjects = [];


/* =========================================================
   ORBIT CREATOR
========================================================= */

function createOrbit(distance) {

    const points = [];

    const segments = 180;

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
                    distance,

                0,

                Math.sin(angle) *
                    distance
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
            color: 0x35566c,
            transparent: true,
            opacity: 0.32
        });

    const orbit =
        new THREE.LineLoop(
            geometry,
            material
        );

    scene.add(orbit);

    return orbit;
}


/* =========================================================
   EARTH ATMOSPHERE
========================================================= */

function createEarthAtmosphere(
    earth
) {

    const atmosphereGeometry =
        new THREE.SphereGeometry(
            4.55,
            64,
            64
        );

    const atmosphereMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x2496ff,
            transparent: true,
            opacity: 0.13,
            side: THREE.BackSide
        });

    const atmosphere =
        new THREE.Mesh(
            atmosphereGeometry,
            atmosphereMaterial
        );

    earth.add(
        atmosphere
    );
}


/* =========================================================
   MOON
========================================================= */

function createMoon(
    earth
) {

    const moonGeometry =
        new THREE.SphereGeometry(
            1.15,
            40,
            40
        );

    const moonTexture =
        textureLoader.load(
            TEXTURES.moon
        );

    const moonMaterial =
        new THREE.MeshStandardMaterial({

            map: moonTexture,

            color: 0xffffff,

            roughness: 1

        });

    const moon =
        new THREE.Mesh(
            moonGeometry,
            moonMaterial
        );

    moon.position.set(
        9,
        0,
        0
    );

    earth.add(
        moon
    );


    /* MOON ORBIT */

    const moonOrbitPoints = [];

    for (
        let i = 0;
        i <= 100;
        i++
    ) {

        const angle =
            i /
            100 *
            Math.PI *
            2;

        moonOrbitPoints.push(
            new THREE.Vector3(
                Math.cos(angle) * 9,
                0,
                Math.sin(angle) * 9
            )
        );
    }

    const moonOrbitGeometry =
        new THREE.BufferGeometry()
            .setFromPoints(
                moonOrbitPoints
            );

    const moonOrbitMaterial =
        new THREE.LineBasicMaterial({
            color: 0x6b8191,
            transparent: true,
            opacity: 0.22
        });

    const moonOrbit =
        new THREE.LineLoop(
            moonOrbitGeometry,
            moonOrbitMaterial
        );

    earth.add(
        moonOrbit
    );


    return {

        moon: moon,

        orbit: moonOrbit,

        angle: 0

    };
}


/* =========================================================
   CREATE PLANET
========================================================= */

function createPlanet(data) {

    const geometry =
        new THREE.SphereGeometry(
            data.radius,
            64,
            64
        );


    let material;


    /*
       Earth gets detailed material
    */

    if (
        data.name === "Earth"
    ) {

        const earthTexture =
            textureLoader.load(
                TEXTURES.earth
            );

        const normalTexture =
            textureLoader.load(
                TEXTURES.earthNormal
            );

        const specularTexture =
            textureLoader.load(
                TEXTURES.earthSpecular
            );

        material =
            new THREE.MeshPhongMaterial({

                map:
                    earthTexture,

                normalMap:
                    normalTexture,

                specularMap:
                    specularTexture,

                specular:
                    new THREE.Color(
                        0x333333
                    ),

                shininess: 15

            });

    }

    else if (
        data.texture
    ) {

        const texture =
            textureLoader.load(
                data.texture
            );

        material =
            new THREE.MeshStandardMaterial({

                map: texture,

                roughness: 0.9,

                metalness: 0

            });

    }

    else {

        material =
            new THREE.MeshStandardMaterial({

                color:
                    data.color,

                roughness:
                    0.85

            });

    }


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );

    mesh.position.x =
        data.distance;

    mesh.userData =
        data;

    scene.add(
        mesh
    );


    const orbit =
        createOrbit(
            data.distance
        );


    const object = {

        mesh: mesh,

        data: data,

        orbit: orbit,

        angle:
            Math.random() *
            Math.PI *
            2,

        moon: null

    };


    /* EARTH */

    if (
        data.name === "Earth"
    ) {

        createEarthAtmosphere(
            mesh
        );

        object.moon =
            createMoon(
                mesh
            );
    }


    /* SATURN */

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

                color:
                    0xc1ad82,

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
            Math.PI / 2.45;

        mesh.add(
            rings
        );
    }


    planetObjects.push(
        object
    );

    return object;
}


/* =========================================================
   CREATE PLANETS
========================================================= */

planets.forEach(
    createPlanet
);


/* =========================================================
   LABEL SYSTEM
========================================================= */

let labelsVisible = false;

const labels = [];


function createLabel(
    text,
    position
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
        512,
        128
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.font =
        "bold 42px Arial";

    ctx.textAlign =
        "center";

    ctx.fillText(
        text,
        256,
        76
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
        24,
        6,
        1
    );

    sprite.position.copy(
        position
    );

    sprite.visible =
        labelsVisible;

    scene.add(
        sprite
    );

    labels.push(
        sprite
    );

    return sprite;
}


planetObjects.forEach(
    planet => {

        planet.label =
            createLabel(
                planet.data.name,
                planet.mesh.position
            );

    }
);


/* =========================================================
   PLANET INFORMATION
========================================================= */

function showPlanetInfo(
    data
) {

    infoPanel.innerHTML = `

        <div class="info-title">
            ${data.name.toUpperCase()}
        </div>

        <div class="info-line">
            ${data.description}
        </div>

        <div class="info-line">
            Visual Orbit:
            ${data.distance}
        </div>

        <div class="info-line">
            REALISTIC 3D MODEL
        </div>

    `;
}


/* =========================================================
   RAYCASTING
========================================================= */

const raycaster =
    new THREE.Raycaster();

const mouse =
    new THREE.Vector2();


renderer.domElement.addEventListener(
    "pointerdown",
    function (event) {

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
            selected &&
            selected.userData.name
        ) {

            showPlanetInfo(
                selected.userData
            );

            controls.target.copy(
                selected.position
            );

        }

    }
);


/* =========================================================
   ORBITS BUTTON
========================================================= */

let orbitsVisible = true;

document
    .getElementById(
        "toggleOrbits"
    )
    .addEventListener(
        "click",
        function () {

            orbitsVisible =
                !orbitsVisible;

            planetObjects.forEach(
                planet => {

                    planet.orbit.visible =
                        orbitsVisible;

                }
            );

            this.textContent =
                orbitsVisible
                    ? "ORBITS"
                    : "ORBIT OFF";

        }
    );


/* =========================================================
   LABEL BUTTON
========================================================= */

document
    .getElementById(
        "toggleLabels"
    )
    .addEventListener(
        "click",
        function () {

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
   RESET CAMERA
========================================================= */

document
    .getElementById(
        "resetCamera"
    )
    .addEventListener(
        "click",
        function () {

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
   ANIMATION
========================================================= */

const clock =
    new THREE.Clock();


function animate() {

    requestAnimationFrame(
        animate
    );

    const delta =
        clock.getDelta();


    /* SUN */

    sun.rotation.y +=
        delta * 0.12;

    sunGlow.rotation.y -=
        delta * 0.04;


    /* STARS */

    stars.rotation.y +=
        delta * 0.0015;


    /* PLANETS */

    planetObjects.forEach(
        planet => {

            planet.angle +=
                planet.data.speed;


            const angle =
                planet.angle;


            const distance =
                planet.data.distance;


            planet.mesh.position.x =
                Math.cos(angle) *
                distance;


            planet.mesh.position.z =
                Math.sin(angle) *
                distance;


            planet.mesh.rotation.y +=
                delta * 0.3;


            /* LABEL */

            if (
                planet.label
            ) {

                planet.label.position.copy(
                    planet.mesh.position
                );

                planet.label.position.y +=
                    planet.data.radius + 5;

            }


            /* MOON */

            if (
                planet.moon
            ) {

                planet.moon.angle +=
                    delta * 0.7;


                const moonAngle =
                    planet.moon.angle;


                planet.moon.moon.position.x =
                    Math.cos(
                        moonAngle
                    ) * 9;


                planet.moon.moon.position.z =
                    Math.sin(
                        moonAngle
                    ) * 9;


                planet.moon.moon.rotation.y +=
                    delta * 0.2;

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
    function () {

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