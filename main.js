// ═══════════════════════════════════════════
// Solar System Explorer — Full 3D Experience
// ═══════════════════════════════════════════

let scene, camera, renderer, clock;
let simTime = 0, simSpeed = 1, paused = false;
let orbitsVisible = true, labelsVisible = true, stationsVisible = true;
let followTarget = null;
let planets = [], moons = [], stations = [], asteroids = [], allBodies = [];
let raycaster, mouse, hoveredObj = null;
let starField, sunLight, ambientLight;

// ── Planet Data ──
const PLANET_DATA = [
    { name:'Mercury', radius:0.38, dist:10, speed:4.15, color:0xb5b5b5, tilt:0.03, rotSpeed:0.01, type:'Terrestrial Planet',
      stats:{'Distance from Sun':'57.9M km','Diameter':'4,879 km','Day Length':'59 Earth days','Year Length':'88 Earth days','Moons':'0','Temp':'-180 to 430°C','Gravity':'3.7 m/s²','Atmosphere':'Virtually none'},
      desc:'The smallest planet and closest to the Sun. Its surface is covered in craters and looks similar to our Moon. Despite being closest to the Sun, it\'s not the hottest — that title goes to Venus.' },
    { name:'Venus', radius:0.95, dist:15, speed:1.62, color:0xe8cda0, tilt:177.4*Math.PI/180, rotSpeed:-0.005, type:'Terrestrial Planet',
      stats:{'Distance from Sun':'108.2M km','Diameter':'12,104 km','Day Length':'243 Earth days','Year Length':'225 Earth days','Moons':'0','Temp':'465°C average','Gravity':'8.87 m/s²','Atmosphere':'96.5% CO₂'},
      desc:'The hottest planet in our solar system due to its thick greenhouse atmosphere. It rotates backwards (retrograde) and a day on Venus is longer than its year. Often called Earth\'s "evil twin".' },
    { name:'Earth', radius:1.0, dist:20, speed:1.0, color:0x4488ff, tilt:23.4*Math.PI/180, rotSpeed:0.02, type:'Terrestrial Planet', hasMoon:true,
      stats:{'Distance from Sun':'149.6M km','Diameter':'12,742 km','Day Length':'24 hours','Year Length':'365.25 days','Moons':'1','Temp':'-89 to 57°C','Gravity':'9.8 m/s²','Atmosphere':'78% N₂, 21% O₂'},
      desc:'Our home — the only known planet with life. 71% of its surface is covered in water. It has a protective magnetic field and an atmosphere that shields life from harmful solar radiation.' },
    { name:'Mars', radius:0.53, dist:28, speed:0.53, color:0xcc5533, tilt:25.2*Math.PI/180, rotSpeed:0.019, type:'Terrestrial Planet',
      stats:{'Distance from Sun':'227.9M km','Diameter':'6,779 km','Day Length':'24.6 hours','Year Length':'687 Earth days','Moons':'2','Temp':'-87 to -5°C','Gravity':'3.72 m/s²','Atmosphere':'95% CO₂'},
      desc:'The Red Planet — home to Olympus Mons (tallest volcano) and Valles Marineris (largest canyon). NASA\'s rovers are currently exploring its surface. Elon Musk wants to colonize it.' },
    { name:'Jupiter', radius:3.5, dist:45, speed:0.084, color:0xd4a574, tilt:3.1*Math.PI/180, rotSpeed:0.04, type:'Gas Giant', hasRing:false,
      stats:{'Distance from Sun':'778.5M km','Diameter':'139,820 km','Day Length':'9.93 hours','Year Length':'11.86 years','Moons':'95','Temp':'-110°C','Gravity':'24.79 m/s²','Atmosphere':'90% H₂, 10% He'},
      desc:'The largest planet — you could fit 1,300 Earths inside it. The Great Red Spot is a storm bigger than Earth that\'s been raging for centuries. It has a faint ring system and 95 known moons.',
      moonData:[
        {name:'Io',radius:0.28,dist:6,speed:2.5,color:0xeecc33},
        {name:'Europa',radius:0.24,dist:7.5,speed:1.8,color:0xccddee},
        {name:'Ganymede',radius:0.42,dist:9,speed:1.2,color:0x998877},
        {name:'Callisto',radius:0.38,dist:11,speed:0.7,color:0x665544}
      ]},
    { name:'Saturn', radius:3.0, dist:65, speed:0.034, color:0xead6a6, tilt:26.7*Math.PI/180, rotSpeed:0.038, type:'Gas Giant', hasRing:true,
      stats:{'Distance from Sun':'1.43B km','Diameter':'116,460 km','Day Length':'10.7 hours','Year Length':'29.46 years','Moons':'146','Temp':'-140°C','Gravity':'10.44 m/s²','Atmosphere':'96% H₂, 3% He'},
      desc:'Famous for its spectacular ring system made of ice and rock. It\'s the least dense planet — it would float in water! Its moon Titan has a thick atmosphere and liquid methane lakes.',
      moonData:[
        {name:'Titan',radius:0.4,dist:7,speed:0.8,color:0xcc9944},
        {name:'Enceladus',radius:0.12,dist:5,speed:1.5,color:0xeeeeff},
        {name:'Mimas',radius:0.08,dist:4,speed:2.0,color:0xbbbbcc}
      ]},
    { name:'Uranus', radius:2.0, dist:82, speed:0.012, color:0x88ccdd, tilt:97.8*Math.PI/180, rotSpeed:-0.03, type:'Ice Giant', hasRing:true,
      stats:{'Distance from Sun':'2.87B km','Diameter':'50,724 km','Day Length':'17.2 hours','Year Length':'84 years','Moons':'27','Temp':'-195°C','Gravity':'8.87 m/s²','Atmosphere':'83% H₂, 15% He'},
      desc:'The sideways planet — it rotates on its side with an axial tilt of 98°. It has faint rings and a pale blue-green color from methane in its atmosphere. An ice giant with extreme seasons.' },
    { name:'Neptune', radius:1.9, dist:100, speed:0.006, color:0x3355cc, tilt:28.3*Math.PI/180, rotSpeed:0.032, type:'Ice Giant',
      stats:{'Distance from Sun':'4.5B km','Diameter':'49,244 km','Day Length':'16.1 hours','Year Length':'164.8 years','Moons':'16','Temp':'-200°C','Gravity':'11.15 m/s²','Atmosphere':'80% H₂, 19% He'},
      desc:'The windiest planet with speeds up to 2,100 km/h. It\'s deep blue from methane absorption. Its moon Triton orbits backwards and has nitrogen geysers. The most distant planet.' }
];

const SUN_DATA = {
    name:'The Sun', radius:5, type:'G-type Main Sequence Star',
    stats:{'Diameter':'1.39M km','Surface Temp':'5,500°C','Core Temp':'15M °C','Age':'4.6B years','Mass':'333,000× Earth','Composition':'73% H, 25% He','Luminosity':'3.8×10²⁶ W','Rotation':'25-35 days'},
    desc:'Our star — a massive ball of hydrogen and helium plasma. It contains 99.86% of the solar system\'s mass. Energy from nuclear fusion in its core takes 170,000 years to reach the surface, then 8 minutes to reach Earth.'
};

const STATION_DATA = [
    { name:'ISS', orbitPlanet:'Earth', dist:3.2, speed:8.0, size:0.25, color:0xcccccc,
      type:'Space Station', stats:{'Altitude':'408 km','Speed':'27,600 km/h','Orbit Period':'92 min','Crew':'6-7','Length':'109 m','Mass':'420,000 kg','Solar Panels':'8','First Module':'1998'},
      desc:'The International Space Station — humanity\'s outpost in orbit. Continuously inhabited since 2000, it orbits Earth every 92 minutes at 27,600 km/h.' },
    { name:'Tiangong', orbitPlanet:'Earth', dist:3.8, speed:6.5, size:0.18, color:0xffd700,
      type:'Space Station', stats:{'Altitude':'340-450 km','Speed':'27,600 km/h','Orbit Period':'91 min','Crew':'3-6','Length':'55 m','Mass':'100,000 kg','Country':'China','Launched':'2021'},
      desc:'China\'s space station — "Heavenly Palace". Fully operational with science experiments onboard. Reaches similar orbital speeds to the ISS.' },
    { name:'Hubble', orbitPlanet:'Earth', dist:3.5, speed:7.0, size:0.12, color:0x8888ff,
      type:'Space Telescope', stats:{'Altitude':'547 km','Speed':'27,400 km/h','Orbit Period':'95 min','Mirror':'2.4 m','Launched':'1990','Weight':'11,110 kg','Pictures Taken':'1.5M+','Decommission':'~2030'},
      desc:'The Hubble Space Telescope — one of humanity\'s greatest scientific instruments. It has captured over 1.5 million observations and reshaped our understanding of the universe.' },
    { name:'James Webb', orbitPlanet:null, lagrangeL2:true, dist:0, speed:0, size:0.15, color:0xff6644,
      type:'Space Telescope', stats:{'Location':'L2 Lagrange Point','Distance':'1.5M km','Mirror':'6.5 m','Launched':'2021','Cost':'$10B','Wavelength':'Infrared','Shield Size':'22×12 m','Orbit':'Halo orbit L2'},
      desc:'The James Webb Space Telescope — the most powerful space telescope ever built. It orbits the L2 Lagrange point 1.5 million km from Earth, looking back to the dawn of the universe.' },
    { name:'Gateway', orbitPlanet:'Moon', parentMoon:'Luna', dist:2.0, speed:3.0, size:0.2, color:0x44aaff,
      type:'Planned Station', stats:{'Location':'Lunar orbit','Altitude':'~3,000 km','Purpose':'Artemis base','Status':'Planning phase','Modules':'4+','Crew':'4','Planned':'~2028','Partners':'NASA, ESA, JAXA, CSA'},
      desc:'Lunar Gateway — the planned space station orbiting the Moon. It will serve as a staging point for Artemis missions to the lunar surface and eventually deep space exploration.' }
];

// ── Init ──
function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
    camera.position.set(0, 40, 60);
    
    renderer = new THREE.WebGLRenderer({ antialias:true, alpha:true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    document.body.appendChild(renderer.domElement);
    
    clock = new THREE.Clock();
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // Lights
    sunLight = new THREE.PointLight(0xffeedd, 2, 500);
    sunLight.castShadow = true;
    scene.add(sunLight);
    ambientLight = new THREE.AmbientLight(0x111122, 0.3);
    scene.add(ambientLight);
    
    createStarfield();
    createNebula();
    createSun();
    createPlanets();
    createAsteroidBelt();
    createKuiperBelt();
    createSpaceStations();
    setupControls();
    setupEvents();
    
    document.getElementById('loading').style.display = 'none';
    updateSpeedDisplay();
    animate();
}

// ── Starfield ──
function createStarfield() {
    const geo = new THREE.BufferGeometry();
    const count = 12000;
    const pos = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
        const r = 400 + Math.random() * 600;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);
        pos[i*3]   = r * Math.sin(phi) * Math.cos(theta);
        pos[i*3+1] = r * Math.sin(phi) * Math.sin(theta);
        pos[i*3+2] = r * Math.cos(phi);
        
        const temp = Math.random();
        if (temp > 0.9) { colors[i*3]=1; colors[i*3+1]=0.8; colors[i*3+2]=0.6; } // warm
        else if (temp > 0.7) { colors[i*3]=0.7; colors[i*3+1]=0.8; colors[i*3+2]=1; } // blue
        else { colors[i*3]=0.9; colors[i*3+1]=0.9; colors[i*3+2]=1; } // white
        
        sizes[i] = 0.3 + Math.random() * 1.5;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
    
    const mat = new THREE.PointsMaterial({ size:0.8, vertexColors:true, transparent:true, opacity:0.9, sizeAttenuation:true });
    starField = new THREE.Points(geo, mat);
    scene.add(starField);
}

// ── Nebula Background ──
function createNebula() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    // Deep space gradient
    const grad = ctx.createRadialGradient(512,512,0, 512,512,512);
    grad.addColorStop(0, 'rgba(20,10,40,0.3)');
    grad.addColorStop(0.4, 'rgba(10,5,30,0.1)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,1024,1024);
    
    // Nebula blobs
    for (let i = 0; i < 15; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = 50 + Math.random() * 200;
        const g2 = ctx.createRadialGradient(x,y,0,x,y,r);
        const hue = Math.random() * 60 + 220;
        g2.addColorStop(0, `hsla(${hue},60%,30%,0.08)`);
        g2.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g2;
        ctx.fillRect(0,0,1024,1024);
    }
    
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map:tex, transparent:true, opacity:0.6 });
    const sprite = new THREE.Sprite(mat);
    sprite.scale.set(1200,1200,1);
    scene.add(sprite);
}

// ── Sun ──
function createSun() {
    // Core
    const geo = new THREE.SphereGeometry(SUN_DATA.radius, 64, 64);
    const mat = new THREE.MeshBasicMaterial({ color:0xffcc44 });
    const sun = new THREE.Mesh(geo, mat);
    sun.userData = { ...SUN_DATA, bodyType:'star' };
    scene.add(sun);
    allBodies.push(sun);
    
    // Glow layers
    for (let i = 1; i <= 4; i++) {
        const glowGeo = new THREE.SphereGeometry(SUN_DATA.radius + i*0.8, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: i < 3 ? 0xff8800 : 0xff4400,
            transparent:true, opacity: 0.08 / i, side: THREE.BackSide
        });
        scene.add(new THREE.Mesh(glowGeo, glowMat));
    }
    
    // Corona
    const coronaGeo = new THREE.SphereGeometry(SUN_DATA.radius + 3, 32, 32);
    const coronaMat = new THREE.MeshBasicMaterial({
        color:0xff6600, transparent:true, opacity:0.03, side:THREE.BackSide
    });
    scene.add(new THREE.Mesh(coronaGeo, coronaMat));
    
    // Solar flare particles
    const flareGeo = new THREE.BufferGeometry();
    const flareCount = 500;
    const flarePos = new Float32Array(flareCount * 3);
    for (let i = 0; i < flareCount; i++) {
        const r = SUN_DATA.radius + 0.5 + Math.random() * 4;
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2*Math.random()-1);
        flarePos[i*3] = r*Math.sin(phi)*Math.cos(theta);
        flarePos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
        flarePos[i*3+2] = r*Math.cos(phi);
    }
    flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos, 3));
    const flareMat = new THREE.PointsMaterial({ color:0xffaa44, size:0.3, transparent:true, opacity:0.4 });
    scene.add(new THREE.Points(flareGeo, flareMat));
}

// ── Planets ──
function createPlanets() {
    PLANET_DATA.forEach(data => {
        const planet = createPlanet(data);
        planets.push(planet);
        allBodies.push(planet.mesh);
        
        // Moons
        if (data.name === 'Earth') {
            const moon = createMoon({ name:'Luna', radius:0.27, dist:2.5, speed:3.0, color:0xcccccc }, planet);
            planet.moons = [moon];
        }
        if (data.moonData) {
            planet.moons = data.moonData.map(md => createMoon(md, planet));
        }
    });
}

function createPlanet(data) {
    const group = new THREE.Group();
    
    // Planet body
    const geo = new THREE.SphereGeometry(data.radius, 48, 48);
    const mat = new THREE.MeshStandardMaterial({
        color: data.color,
        roughness: 0.7,
        metalness: 0.1
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { ...data, bodyType:'planet' };
    group.add(mesh);
    
    // Earth special - land masses
    if (data.name === 'Earth') {
        const landCanvas = document.createElement('canvas');
        landCanvas.width = 512; landCanvas.height = 256;
        const lctx = landCanvas.getContext('2d');
        lctx.fillStyle = '#2266aa';
        lctx.fillRect(0,0,512,256);
        // Simple continents
        lctx.fillStyle = '#44aa44';
        const continents = [
            [120,60,80,50],[280,50,60,40],[320,80,40,60],[200,120,50,40],
            [80,100,40,50],[350,40,80,30],[150,160,30,40],[400,70,50,40]
        ];
        continents.forEach(([x,y,w,h]) => {
            lctx.beginPath();
            lctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2);
            lctx.fill();
        });
        // Ice caps
        lctx.fillStyle = '#ddeeff';
        lctx.fillRect(0,0,512,15);
        lctx.fillRect(0,241,512,15);
        // Clouds
        lctx.fillStyle = 'rgba(255,255,255,0.25)';
        for (let i=0;i<20;i++) {
            lctx.beginPath();
            lctx.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,5+Math.random()*10,0,0,Math.PI*2);
            lctx.fill();
        }
        const earthTex = new THREE.CanvasTexture(landCanvas);
        mat.map = earthTex;
        mat.needsUpdate = true;
        
        // Atmosphere
        const atmoGeo = new THREE.SphereGeometry(data.radius*1.02, 48, 48);
        const atmoMat = new THREE.MeshBasicMaterial({
            color:0x88bbff, transparent:true, opacity:0.15, side:THREE.BackSide
        });
        group.add(new THREE.Mesh(atmoGeo, atmoMat));
    }
    
    // Jupiter bands
    if (data.name === 'Jupiter') {
        const bandCanvas = document.createElement('canvas');
        bandCanvas.width = 512; bandCanvas.height = 256;
        const bctx = bandCanvas.getContext('2d');
        for (let y=0;y<256;y++) {
            const band = Math.sin(y*0.1)*0.5 + Math.sin(y*0.05+1)*0.3;
            const r = Math.floor(180+band*50);
            const g = Math.floor(140+band*40);
            const b = Math.floor(100+band*30);
            bctx.fillStyle = `rgb(${r},${g},${b})`;
            bctx.fillRect(0,y,512,1);
        }
        // Great Red Spot
        bctx.fillStyle = '#cc5533';
        bctx.beginPath();
        bctx.ellipse(200,150,30,15,0,0,Math.PI*2);
        bctx.fill();
        const jupTex = new THREE.CanvasTexture(bandCanvas);
        mat.map = jupTex;
        mat.needsUpdate = true;
    }
    
    // Mars surface
    if (data.name === 'Mars') {
        const marsCanvas = document.createElement('canvas');
        marsCanvas.width = 512; marsCanvas.height = 256;
        const mctx = marsCanvas.getContext('2d');
        mctx.fillStyle = '#cc5533';
        mctx.fillRect(0,0,512,256);
        // Polar ice
        mctx.fillStyle = '#eeddcc';
        mctx.fillRect(0,0,512,20);
        mctx.fillRect(0,236,512,20);
        // Dark regions
        mctx.fillStyle = '#993322';
        for (let i=0;i<8;i++) {
            mctx.beginPath();
            mctx.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,10+Math.random()*20,0,0,Math.PI*2);
            mctx.fill();
        }
        const marsTex = new THREE.CanvasTexture(marsCanvas);
        mat.map = marsTex;
        mat.needsUpdate = true;
    }
    
    // Saturn rings
    if (data.name === 'Saturn') {
        const ring = createRings(data.radius*1.4, data.radius*2.8, 0xd4b896, 0.5);
        ring.rotation.x = 0.5;
        group.add(ring);
    }
    
    // Uranus rings
    if (data.name === 'Uranus') {
        const ring = createRings(data.radius*1.3, data.radius*2.0, 0x88aacc, 0.2);
        ring.rotation.x = Math.PI/2 - 0.2;
        group.add(ring);
    }
    
    // Orbit line
    const orbitGeo = new THREE.BufferGeometry();
    const orbitPoints = [];
    for (let i = 0; i <= 128; i++) {
        const angle = (i / 128) * Math.PI * 2;
        orbitPoints.push(new THREE.Vector3(Math.cos(angle)*data.dist, 0, Math.sin(angle)*data.dist));
    }
    orbitGeo.setFromPoints(orbitPoints);
    const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({ color:0x334466, transparent:true, opacity:0.3 }));
    scene.add(orbitLine);
    
    // Axial tilt
    mesh.rotation.z = data.tilt || 0;
    
    const planetObj = {
        mesh, group, data, orbitLine,
        angle: Math.random() * Math.PI * 2,
        moons: [],
        update(dt) {
            if (!paused) {
                this.angle += data.speed * dt * 0.1 * simSpeed;
            }
            this.group.position.x = Math.cos(this.angle) * data.dist;
            this.group.position.z = Math.sin(this.angle) * data.dist;
            if (!paused) {
                mesh.rotation.y += data.rotSpeed * dt * simSpeed;
            }
            this.moons.forEach(m => m.update(dt));
        }
    };
    
    scene.add(group);
    return planetObj;
}

function createRings(inner, outer, color, opacity) {
    const ringGeo = new THREE.RingGeometry(inner, outer, 64);
    // Fix UVs for ring
    const pos = ringGeo.attributes.position;
    const uv = ringGeo.attributes.uv;
    for (let i=0; i<pos.count; i++) {
        const x = pos.getX(i), z = pos.getZ(i) || pos.getY(i);
        const dist = Math.sqrt(x*x + z*z);
        uv.setXY(i, (dist-inner)/(outer-inner), 0.5);
    }
    
    const ringMat = new THREE.MeshBasicMaterial({
        color, transparent:true, opacity, side:THREE.DoubleSide
    });
    return new THREE.Mesh(ringGeo, ringMat);
}

// ── Moons ──
function createMoon(data, parent) {
    const geo = new THREE.SphereGeometry(data.radius, 24, 24);
    const mat = new THREE.MeshStandardMaterial({ color:data.color, roughness:0.8 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.userData = { name:data.name, type:'Moon', bodyType:'moon', stats:{'Parent':parent.data.name,'Radius':data.radius+' (relative)','Orbit Speed':data.speed.toFixed(1)+' (relative)'}, desc:`A moon orbiting ${parent.data.name}.` };
    allBodies.push(mesh);
    parent.group.add(mesh);
    
    return {
        mesh, angle: Math.random()*Math.PI*2,
        update(dt) {
            if (!paused) this.angle += data.speed * dt * 0.1 * simSpeed;
            this.mesh.position.x = Math.cos(this.angle) * data.dist;
            this.mesh.position.z = Math.sin(this.angle) * data.dist;
        }
    };
}

// ── Asteroid Belt ──
function createAsteroidBelt() {
    const count = 2000;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 34 + Math.random() * 8;
        const y = (Math.random()-0.5) * 1.5;
        pos[i*3] = Math.cos(angle)*dist;
        pos[i*3+1] = y;
        pos[i*3+2] = Math.sin(angle)*dist;
        sizes[i] = 0.05 + Math.random() * 0.15;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    geo.setAttribute('size', new THREE.BufferAttribute(sizes,1));
    const mat = new THREE.PointsMaterial({ color:0x887766, size:0.15, transparent:true, opacity:0.6 });
    asteroids.push(new THREE.Points(geo, mat));
    scene.add(asteroids[0]);
}

// ── Kuiper Belt ──
function createKuiperBelt() {
    const count = 1500;
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(count * 3);
    
    for (let i=0; i<count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = 90 + Math.random() * 30;
        const y = (Math.random()-0.5) * 4;
        pos[i*3] = Math.cos(angle)*dist;
        pos[i*3+1] = y;
        pos[i*3+2] = Math.sin(angle)*dist;
    }
    
    geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
    const mat = new THREE.PointsMaterial({ color:0x667788, size:0.1, transparent:true, opacity:0.4 });
    asteroids.push(new THREE.Points(geo, mat));
    scene.add(asteroids[1]);
}

// ── Space Stations ──
function createSpaceStations() {
    STATION_DATA.forEach(data => {
        const station = createStation(data);
        stations.push(station);
        allBodies.push(station.mesh);
    });
}

function createStation(data) {
    const group = new THREE.Group();
    
    // Station body - modular design
    const bodyGeo = new THREE.BoxGeometry(data.size, data.size*0.4, data.size*0.4);
    const bodyMat = new THREE.MeshStandardMaterial({ color:data.color, metalness:0.8, roughness:0.2 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    
    // Solar panels
    if (data.name !== 'James Webb') {
        const panelGeo = new THREE.BoxGeometry(data.size*1.5, data.size*0.02, data.size*0.6);
        const panelMat = new THREE.MeshStandardMaterial({ color:0x2244aa, metalness:0.5, roughness:0.3 });
        const panelL = new THREE.Mesh(panelGeo, panelMat);
        panelL.position.x = data.size*1.0;
        group.add(panelL);
        const panelR = panelL.clone();
        panelR.position.x = -data.size*1.0;
        group.add(panelR);
    }
    
    // JWST special - sun shield
    if (data.name === 'James Webb') {
        const shieldGeo = new THREE.BoxGeometry(data.size*2, data.size*0.02, data.size*1.5);
        const shieldMat = new THREE.MeshStandardMaterial({ color:0xdd8855, metalness:0.3, roughness:0.5 });
        const shield = new THREE.Mesh(shieldGeo, shieldMat);
        shield.rotation.y = Math.PI/4;
        group.add(shield);
    }
    
    // ISS modules
    if (data.name === 'ISS') {
        for (let i=0;i<4;i++) {
            const modGeo = new THREE.CylinderGeometry(data.size*0.1, data.size*0.1, data.size*0.3, 8);
            const mod = new THREE.Mesh(modGeo, bodyMat);
            mod.rotation.z = Math.PI/2;
            mod.position.x = (i-1.5)*data.size*0.35;
            group.add(mod);
        }
    }
    
    // Blinking light
    const lightGeo = new THREE.SphereGeometry(data.size*0.05, 8, 8);
    const lightMat = new THREE.MeshBasicMaterial({ color:0xff0000 });
    const blinkLight = new THREE.Mesh(lightGeo, lightMat);
    blinkLight.position.y = data.size*0.25;
    group.add(blinkLight);
    group.userData.blinkLight = blinkLight;
    
    group.userData = { ...data, bodyType:'station', blinkLight };
    
    // Find parent
    let parentObj = null;
    if (data.orbitPlanet) {
        parentObj = planets.find(p => p.data.name === data.orbitPlanet);
    }
    
    const stationObj = {
        mesh: group, data, parentObj, angle: Math.random()*Math.PI*2,
        update(dt) {
            if (!paused) this.angle += (data.speed || 0.5) * dt * 0.1 * simSpeed;
            
            if (data.lagrangeL2) {
                // JWST at L2 - follows Earth at slight offset
                const earth = planets.find(p => p.data.name === 'Earth');
                if (earth) {
                    this.mesh.position.x = earth.group.position.x + 3;
                    this.mesh.position.y = 1;
                    this.mesh.position.z = earth.group.position.z;
                }
            } else if (this.parentObj) {
                if (data.parentMoon) {
                    const moon = this.parentObj.moons?.find(m => m.mesh.userData.name === data.parentMoon);
                    if (moon) {
                        this.mesh.position.x = this.parentObj.group.position.x + Math.cos(this.angle) * data.dist;
                        this.mesh.position.z = this.parentObj.group.position.z + Math.sin(this.angle) * data.dist;
                        this.mesh.position.y = Math.sin(this.angle*0.5) * 0.3;
                    }
                } else {
                    this.mesh.position.x = this.parentObj.group.position.x + Math.cos(this.angle) * data.dist;
                    this.mesh.position.z = this.parentObj.group.position.z + Math.sin(this.angle) * data.dist;
                    this.mesh.position.y = Math.sin(this.angle*0.3) * 0.2;
                }
            }
            
            this.mesh.visible = stationsVisible;
            
            // Blink
            if (group.userData.blinkLight && Math.sin(simTime*3) > 0.7) {
                group.userData.blinkLight.material.color.setHex(0xff0000);
            } else if (group.userData.blinkLight) {
                group.userData.blinkLight.material.color.setHex(0x330000);
            }
            
            // Slow rotate station
            if (!paused) this.mesh.rotation.y += dt * 0.5 * simSpeed;
        }
    };
    
    scene.add(group);
    return stationObj;
}

// ── Camera Controls ──
let isDragging = false, prevMouse = {x:0,y:0};
let camTheta = 0.8, camPhi = 0.6, camDist = 80;
let camTarget = new THREE.Vector3(0,0,0);
let targetCamTarget = new THREE.Vector3(0,0,0);

function setupControls() {
    const canvas = renderer.domElement;
    
    canvas.addEventListener('mousedown', e => { isDragging=true; prevMouse={x:e.clientX,y:e.clientY}; });
    canvas.addEventListener('mousemove', e => {
        if (isDragging) {
            const dx = e.clientX - prevMouse.x;
            const dy = e.clientY - prevMouse.y;
            camTheta -= dx * 0.005;
            camPhi = Math.max(0.1, Math.min(Math.PI-0.1, camPhi - dy * 0.005));
            prevMouse = {x:e.clientX, y:e.clientY};
        }
        // Raycasting
        mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    });
    canvas.addEventListener('mouseup', () => isDragging=false);
    canvas.addEventListener('wheel', e => {
        camDist *= 1 + e.deltaY * 0.001;
        camDist = Math.max(5, Math.min(500, camDist));
    });
    
    // Touch
    canvas.addEventListener('touchstart', e => {
        if (e.touches.length===1) { isDragging=true; prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY}; }
    });
    canvas.addEventListener('touchmove', e => {
        if (isDragging && e.touches.length===1) {
            const dx = e.touches[0].clientX - prevMouse.x;
            const dy = e.touches[0].clientY - prevMouse.y;
            camTheta -= dx*0.005;
            camPhi = Math.max(0.1, Math.min(Math.PI-0.1, camPhi-dy*0.005));
            prevMouse={x:e.touches[0].clientX, y:e.touches[0].clientY};
        }
    });
    canvas.addEventListener('touchend', () => isDragging=false);
    
    // Double click to focus
    canvas.addEventListener('dblclick', e => {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(allBodies, true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj.parent && !obj.userData.name) obj = obj.parent;
            if (obj.userData.name) focusBody(obj);
        }
    });
}

function focusBody(obj) {
    followTarget = obj;
    camDist = (obj.userData.radius || 2) * 5 + 3;
    document.getElementById('btn-follow').classList.add('active');
    showInfo(obj.userData);
}

// ── Events ──
function setupEvents() {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth/window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
    
    // Click
    renderer.domElement.addEventListener('click', e => {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(allBodies, true);
        if (hits.length > 0) {
            let obj = hits[0].object;
            while (obj.parent && !obj.userData.name) obj = obj.parent;
            if (obj.userData.name) showInfo(obj.userData);
        } else {
            document.getElementById('info-panel').classList.remove('visible');
        }
    });
    
    // Buttons
    document.getElementById('btn-pause').onclick = () => {
        paused = !paused;
        document.getElementById('btn-pause').textContent = paused ? '▶ Play' : '⏸ Pause';
        document.getElementById('btn-pause').classList.toggle('active', paused);
    };
    document.getElementById('btn-slower').onclick = () => {
        simSpeed = Math.max(0.1, simSpeed / 2);
        updateSpeedDisplay();
    };
    document.getElementById('btn-faster').onclick = () => {
        simSpeed = Math.min(50, simSpeed * 2);
        updateSpeedDisplay();
    };
    document.getElementById('btn-orbits').onclick = () => {
        orbitsVisible = !orbitsVisible;
        planets.forEach(p => p.orbitLine.visible = orbitsVisible);
        document.getElementById('btn-orbits').classList.toggle('active', orbitsVisible);
    };
    document.getElementById('btn-labels').onclick = () => {
        labelsVisible = !labelsVisible;
        document.getElementById('btn-labels').classList.toggle('active', labelsVisible);
    };
    document.getElementById('btn-follow').onclick = () => {
        if (followTarget) {
            followTarget = null;
            document.getElementById('btn-follow').classList.remove('active');
        }
    };
    document.getElementById('btn-stations').onclick = () => {
        stationsVisible = !stationsVisible;
        document.getElementById('btn-stations').classList.toggle('active', stationsVisible);
    };
    document.getElementById('close-btn').onclick = () => {
        document.getElementById('info-panel').classList.remove('visible');
    };
    
    // Search
    const searchInput = document.getElementById('search-input');
    searchInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            const query = searchInput.value.toLowerCase().trim();
            const match = allBodies.find(b => b.userData.name && b.userData.name.toLowerCase().includes(query));
            if (match) focusBody(match);
            searchInput.value = '';
        }
    });
    
    // Keyboard
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') { followTarget=null; document.getElementById('btn-follow').classList.remove('active'); document.getElementById('info-panel').classList.remove('visible'); }
        if (e.key === ' ') { paused=!paused; document.getElementById('btn-pause').textContent=paused?'▶ Play':'⏸ Pause'; }
        if (e.key === '+' || e.key === '=') { simSpeed=Math.min(50,simSpeed*1.5); updateSpeedDisplay(); }
        if (e.key === '-') { simSpeed=Math.max(0.1,simSpeed/1.5); updateSpeedDisplay(); }
    });
}

function updateSpeedDisplay() {
    document.getElementById('speed-display').textContent = `Speed: ${simSpeed.toFixed(1)}×`;
}

// ── Info Panel ──
function showInfo(data) {
    const panel = document.getElementById('info-panel');
    document.getElementById('info-name').textContent = data.name;
    document.getElementById('info-type').textContent = data.type || '';
    
    let statsHtml = '';
    if (data.stats) {
        Object.entries(data.stats).forEach(([label, value]) => {
            statsHtml += `<div class="stat"><span class="label">${label}</span><span class="value">${value}</span></div>`;
        });
    }
    document.getElementById('info-stats').innerHTML = statsHtml;
    document.getElementById('info-desc').textContent = data.desc || '';
    panel.classList.add('visible');
}

// ── Minimap ──
function drawMinimap() {
    const canvas = document.getElementById('minimap-canvas');
    const ctx = canvas.getContext('2d');
    const cx = 90, cy = 90, scale = 0.85;
    
    ctx.fillStyle = 'rgba(0,0,10,0.8)';
    ctx.fillRect(0,0,180,180);
    
    // Sun
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath();
    ctx.arc(cx,cy,3,0,Math.PI*2);
    ctx.fill();
    
    // Planet orbits & positions
    planets.forEach(p => {
        const dist = p.data.dist * scale;
        ctx.strokeStyle = 'rgba(100,150,255,0.15)';
        ctx.beginPath();
        ctx.arc(cx,cy,dist,0,Math.PI*2);
        ctx.stroke();
        
        const x = cx + Math.cos(p.angle) * dist;
        const y = cy + Math.sin(p.angle) * dist;
        ctx.fillStyle = '#' + p.data.color.toString(16).padStart(6,'0');
        ctx.beginPath();
        ctx.arc(x,y,Math.max(1.5, p.data.radius*0.8),0,Math.PI*2);
        ctx.fill();
    });
    
    // Camera indicator
    const camX = cx + (camera.position.x * scale * 0.5) % 90;
    const camZ = cy + (camera.position.z * scale * 0.5) % 90;
    ctx.fillStyle = '#ff4444';
    ctx.beginPath();
    ctx.arc(camX, camZ, 2, 0, Math.PI*2);
    ctx.fill();
}

// ── Labels (2D overlay via canvas) ──
function drawLabels() {
    if (!labelsVisible) return;
    
    const canvas = renderer.domElement;
    const ctx = renderer.getContext();
    // We'll use a 2D overlay approach
}

// ── Main Loop ──
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.05);
    
    if (!paused) simTime += dt * simSpeed;
    
    // Update sim time display
    const days = Math.floor(simTime * 10);
    const years = Math.floor(days / 365);
    const remDays = days % 365;
    document.getElementById('sim-time').textContent = years > 0 ? `Day ${remDays} of Year ${years+1}` : `Day ${days}`;
    
    // Update planets
    planets.forEach(p => p.update(dt));
    
    // Update stations
    stations.forEach(s => s.update(dt));
    
    // Rotate asteroid belt slowly
    if (asteroids[0] && !paused) asteroids[0].rotation.y += dt * 0.01 * simSpeed;
    if (asteroids[1] && !paused) asteroids[1].rotation.y -= dt * 0.005 * simSpeed;
    
    // Follow target
    if (followTarget) {
        if (followTarget.userData.bodyType === 'planet') {
            const p = planets.find(p => p.mesh === followTarget);
            if (p) targetCamTarget.copy(p.group.position);
        } else {
            targetCamTarget.copy(followTarget.position);
        }
    } else {
        targetCamTarget.set(0,0,0);
    }
    camTarget.lerp(targetCamTarget, 0.05);
    
    // Camera
    camera.position.x = camTarget.x + Math.sin(camPhi) * Math.cos(camTheta) * camDist;
    camera.position.y = camTarget.y + Math.cos(camPhi) * camDist;
    camera.position.z = camTarget.z + Math.sin(camPhi) * Math.sin(camTheta) * camDist;
    camera.lookAt(camTarget);
    
    renderer.render(scene, camera);
    
    // Minimap
    drawMinimap();
}

// ── Start ──
window.addEventListener('load', init);