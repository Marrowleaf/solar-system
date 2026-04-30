// ═══════════════════════════════════════════════════
// ASTRAL COMMAND — Solar System Observatory Engine
// ═══════════════════════════════════════════════════

let scene, camera, renderer, clock;
let simTime = 0, simSpeed = 1, paused = false;
let orbitsVisible = true, labelsVisible = true, stationsVisible = true;
let followTarget = null;
let planets = [], moons = [], stationObjs = [], allBodies = [];
let raycaster, mouseVec, hoveredObj = null;
let starField, sunLight, ambientLight;
let audioCtx, soundEnabled = true, soundVolume = 0.5;
let cameraSensitivity = 5;
let qualityLevel = 'med';
let visitedBodies = new Set();
let achievements = {};
let cometVisible = true;
let isDragging = false, prevMouse = {x:0,y:0};
let camTheta = 0.8, camPhi = 0.6, camDist = 80;
let camTarget = new THREE.Vector3(0,0,0);
let targetCamTarget = new THREE.Vector3(0,0,0);
let targetCamDist = camDist;
let labelElements = [];

// ── BODY DATA ──
const PLANET_DATA = [
  { name:'Mercury', radius:0.38, dist:10, speed:4.15, color:0xb5b5b5, tilt:0.03, rotSpeed:0.01, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'57.9M km','Diameter':'4,879 km','Day Length':'59 Earth days','Year Length':'88 Earth days','Moons':'0','Temperature':'-180 to 430°C','Gravity':'3.7 m/s²','Atmosphere':'Virtually none'},
    desc:'The smallest planet and closest to the Sun. Its surface is covered in craters and looks similar to our Moon. Despite being closest to the Sun, it\'s not the hottest — that title goes to Venus.',
    facts:['Mercury has no atmosphere to retain heat, causing extreme temperature swings.','A year on Mercury is just 88 Earth days.','Mercury\'s core takes up about 85% of the planet\'s radius.'],
    navColor:'#b5b5b5' },
  { name:'Venus', radius:0.95, dist:15, speed:1.62, color:0xe8cda0, tilt:177.4*Math.PI/180, rotSpeed:-0.005, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'108.2M km','Diameter':'12,104 km','Day Length':'243 Earth days','Year Length':'225 Earth days','Moons':'0','Temperature':'465°C average','Gravity':'8.87 m/s²','Atmosphere':'96.5% CO₂'},
    desc:'The hottest planet in our solar system due to its thick greenhouse atmosphere. It rotates backwards (retrograde) and a day on Venus is longer than its year. Often called Earth\'s "evil twin".',
    facts:['Venus rotates backwards — the Sun rises in the west.','A day on Venus (243 Earth days) is longer than its year (225 days).','Venus has crushing surface pressure — 90× Earth\'s.'],
    navColor:'#e8cda0' },
  { name:'Earth', radius:1.0, dist:20, speed:1.0, color:0x4488ff, tilt:23.4*Math.PI/180, rotSpeed:0.02, type:'Terrestrial Planet', badge:'badge-planet', hasAtmosphere:true, hasMoon:true,
    stats:{'Distance from Sun':'149.6M km','Diameter':'12,742 km','Day Length':'24 hours','Year Length':'365.25 days','Moons':'1','Temperature':'-89 to 57°C','Gravity':'9.8 m/s²','Atmosphere':'78% N₂, 21% O₂'},
    desc:'Our home — the only known planet with life. 71% of its surface is covered in water. It has a protective magnetic field and an atmosphere that shields life from harmful solar radiation.',
    facts:['Earth is the densest planet in the solar system.','The Earth\'s rotation is gradually slowing down.','Earth\'s magnetic field extends up to 65,000 km into space.'],
    navColor:'#4488ff' },
  { name:'Mars', radius:0.53, dist:28, speed:0.53, color:0xcc5533, tilt:25.2*Math.PI/180, rotSpeed:0.019, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'227.9M km','Diameter':'6,779 km','Day Length':'24.6 hours','Year Length':'687 Earth days','Moons':'2','Temperature':'-87 to -5°C','Gravity':'3.72 m/s²','Atmosphere':'95% CO₂'},
    desc:'The Red Planet — home to Olympus Mons (tallest volcano) and Valles Marineris (largest canyon). NASA\'s rovers are currently exploring its surface.',
    facts:['Olympus Mons is 21.9 km tall — nearly 3× Mount Everest.','Mars has the largest dust storms in the solar system, lasting months.','Mars\'s two moons, Phobos and Deimos, may be captured asteroids.'],
    moonData: [
      {name:'Phobos',radius:0.08,dist:1.6,speed:5.0,color:0x998877,type:'Moon'},
      {name:'Deimos',radius:0.05,dist:2.2,speed:3.0,color:0x887766,type:'Moon'}
    ],
    navColor:'#cc5533' },
  { name:'Jupiter', radius:3.5, dist:45, speed:0.084, color:0xd4a574, tilt:3.1*Math.PI/180, rotSpeed:0.04, type:'Gas Giant', badge:'badge-planet', hasAtmosphere:true,
    stats:{'Distance from Sun':'778.5M km','Diameter':'139,820 km','Day Length':'9.93 hours','Year Length':'11.86 years','Moons':'95','Temperature':'-110°C','Gravity':'24.79 m/s²','Atmosphere':'90% H₂, 10% He'},
    desc:'The largest planet — you could fit 1,300 Earths inside it. The Great Red Spot is a storm bigger than Earth that\'s been raging for centuries. It has a faint ring system and 95 known moons.',
    facts:['Jupiter\'s Great Red Spot could swallow Earth whole.','Jupiter has the shortest day of any planet — under 10 hours.','Jupiter\'s magnetic field is 20,000× stronger than Earth\'s.'],
    moonData: [
      {name:'Io',radius:0.28,dist:6,speed:2.5,color:0xeecc33,type:'Moon'},
      {name:'Europa',radius:0.24,dist:7.5,speed:1.8,color:0xccddee,type:'Moon'},
      {name:'Ganymede',radius:0.42,dist:9,speed:1.2,color:0x998877,type:'Moon'},
      {name:'Callisto',radius:0.38,dist:11,speed:0.7,color:0x665544,type:'Moon'}
    ],
    navColor:'#d4a574' },
  { name:'Saturn', radius:3.0, dist:65, speed:0.034, color:0xead6a6, tilt:26.7*Math.PI/180, rotSpeed:0.038, type:'Gas Giant', badge:'badge-planet', hasRing:true, hasAtmosphere:true,
    stats:{'Distance from Sun':'1.43B km','Diameter':'116,460 km','Day Length':'10.7 hours','Year Length':'29.46 years','Moons':'146','Temperature':'-140°C','Gravity':'10.44 m/s²','Atmosphere':'96% H₂, 3% He'},
    desc:'Famous for its spectacular ring system made of ice and rock. It\'s the least dense planet — it would float in water! Its moon Titan has a thick atmosphere and liquid methane lakes.',
    facts:['Saturn\'s rings are mostly water ice, ranging from tiny grains to house-sized chunks.','Saturn is so light it would float in a bathtub (if one existed that large).','Winds on Saturn can reach 1,800 km/h near the equator.'],
    moonData: [
      {name:'Titan',radius:0.4,dist:7,speed:0.8,color:0xcc9944,type:'Moon'},
      {name:'Enceladus',radius:0.12,dist:5,speed:1.5,color:0xeeeeff,type:'Moon'},
      {name:'Mimas',radius:0.08,dist:4,speed:2.0,color:0xbbbbcc,type:'Moon'}
    ],
    navColor:'#ead6a6' },
  { name:'Uranus', radius:2.0, dist:82, speed:0.012, color:0x88ccdd, tilt:97.8*Math.PI/180, rotSpeed:-0.03, type:'Ice Giant', badge:'badge-planet', hasRing:true,
    stats:{'Distance from Sun':'2.87B km','Diameter':'50,724 km','Day Length':'17.2 hours','Year Length':'84 years','Moons':'27','Temperature':'-195°C','Gravity':'8.87 m/s²','Atmosphere':'83% H₂, 15% He'},
    desc:'The sideways planet — it rotates on its side with an axial tilt of 98°. It has faint rings and a pale blue-green color from methane in its atmosphere. An ice giant with extreme seasons.',
    facts:['Uranus rotates on its side, likely from an ancient collision.','Uranus has 13 known rings, discovered in 1977.','Uranus\'s seasons each last about 21 Earth years.'],
    moonData: [
      {name:'Miranda',radius:0.1,dist:3.5,speed:2.0,color:0xaabbcc,type:'Moon'},
      {name:'Ariel',radius:0.14,dist:4.5,speed:1.5,color:0xbbccdd,type:'Moon'}
    ],
    navColor:'#88ccdd' },
  { name:'Neptune', radius:1.9, dist:100, speed:0.006, color:0x3355cc, tilt:28.3*Math.PI/180, rotSpeed:0.032, type:'Ice Giant', badge:'badge-planet', hasAtmosphere:true,
    stats:{'Distance from Sun':'4.5B km','Diameter':'49,244 km','Day Length':'16.1 hours','Year Length':'164.8 years','Moons':'16','Temperature':'-200°C','Gravity':'11.15 m/s²','Atmosphere':'80% H₂, 19% He'},
    desc:'The windiest planet with speeds up to 2,100 km/h. It\'s deep blue from methane absorption. Its moon Triton orbits backwards and has nitrogen geysers. The most distant planet.',
    facts:['Neptune has the strongest winds of any planet — up to 2,100 km/h.','Neptune was the first planet found by mathematical prediction.','Neptune\'s moon Triton orbits in the opposite direction.'],
    moonData: [
      {name:'Triton',radius:0.22,dist:4,speed:1.5,color:0x99aabb,type:'Moon'}
    ],
    navColor:'#3355cc' }
];

const SUN_DATA = {
  name:'The Sun', radius:5, type:'G-type Main Sequence Star', badge:'badge-star',
  stats:{'Diameter':'1.39M km','Surface Temp':'5,500°C','Core Temp':'15M °C','Age':'4.6B years','Mass':'333,000× Earth','Composition':'73% H, 25% He','Luminosity':'3.8×10²⁶ W','Rotation':'25-35 days'},
  desc:'Our star — a massive ball of hydrogen and helium plasma. It contains 99.86% of the solar system\'s mass. Energy from nuclear fusion in its core takes 170,000 years to reach the surface, then 8 minutes to reach Earth.',
  facts:['The Sun loses 4 million tonnes of mass every second through fusion.','Light from the Sun takes 8 minutes 20 seconds to reach Earth.','The Sun\'s core temperature is about 15 million °C.'],
  navColor:'#FFB800'
};

const DWARF_DATA = [
  { name:'Ceres', radius:0.25, dist:35, speed:0.35, color:0x778899, tilt:0.03, rotSpeed:0.01, type:'Dwarf Planet', badge:'badge-dwarf',
    stats:{'Distance from Sun':'413.7M km','Diameter':'939 km','Day Length':'9.1 hours','Year Length':'4.6 years','Moons':'0','Temperature':'-106°C','Gravity':'0.28 m/s²','Atmosphere':'Transient water vapor'},
    desc:'The largest object in the asteroid belt and the only dwarf planet in the inner solar system. Ceres was once classified as an asteroid before being promoted to dwarf planet status in 2006.',
    facts:['Ceres contains about a third of the asteroid belt\'s total mass.','NASA\'s Dawn mission found organic molecules on Ceres.','Ceres may have a subsurface ocean of liquid water.'],
    navColor:'#778899' },
  { name:'Pluto', radius:0.25, dist:115, speed:0.004, color:0xccbbaa, tilt:122.5*Math.PI/180, rotSpeed:-0.01, type:'Dwarf Planet', badge:'badge-dwarf',
    stats:{'Distance from Sun':'5.9B km','Diameter':'2,377 km','Day Length':'6.4 Earth days','Year Length':'248 years','Moons':'5','Temperature':'-230°C','Gravity':'0.62 m/s²','Atmosphere':'Thin N₂'},
    desc:'Once the 9th planet, now a dwarf planet since 2006. Pluto has a heart-shaped nitrogen ice plain called Tombaugh Regio, discovered by NASA\'s New Horizons in 2015.',
    facts:['Pluto\'s heart-shaped region is called Tombaugh Regio.','Pluto is smaller than Earth\'s Moon.','New Horizons revealed Pluto has blue skies and water ice.'],
    moonData: [
      {name:'Charon',radius:0.12,dist:2.5,speed:1.0,color:0x998877,type:'Moon'}
    ],
    navColor:'#ccbbaa' }
];

const COMET_DATA = {
  name:'Halley', radius:0.15, type:'Periodic Comet', badge:'badge-comet',
  perihelion:15, aphelion:90, speed:0.15, eccentricity:0.967,
  stats:{'Orbital Period':'75-79 years','Last Perihelion':'1986','Next Perihelion':'2061','Nucleus':'15×8 km','Tail Length':'Up to 100M km','Composition':'Ice, dust, CO₂','Discovery':'Edmond Halley, 1705','First Observed':'240 BC'},
  desc:'The most famous periodic comet, visible from Earth every 75-79 years. Its nucleus is a dirty snowball of ice and dust that develops a spectacular tail when near the Sun.',
  facts:['Halley\'s Comet has been observed for over 2,200 years.','Mark Twain was born and died in Halley\'s Comet years (1835, 1910).','The comet will next be visible in mid-2061.'],
  navColor:'#aaddff'
};

const STATION_DATA = [
  { name:'ISS', orbitPlanet:'Earth', dist:3.2, speed:8.0, size:0.25, color:0xcccccc,
    type:'Space Station', badge:'badge-station',
    stats:{'Altitude':'408 km','Speed':'27,600 km/h','Orbit Period':'92 min','Crew':'6-7','Length':'109 m','Mass':'420,000 kg','Solar Panels':'8','First Module':'1998'},
    desc:'The International Space Station — humanity\'s outpost in orbit. Continuously inhabited since 2000, it orbits Earth every 92 minutes at 27,600 km/h.' },
  { name:'Tiangong', orbitPlanet:'Earth', dist:3.8, speed:6.5, size:0.18, color:0xffd700,
    type:'Space Station', badge:'badge-station',
    stats:{'Altitude':'340-450 km','Speed':'27,600 km/h','Orbit Period':'91 min','Crew':'3-6','Length':'55 m','Mass':'100,000 kg','Country':'China','Launched':'2021'},
    desc:'China\'s space station — "Heavenly Palace". Fully operational with science experiments onboard.' },
  { name:'Hubble', orbitPlanet:'Earth', dist:3.5, speed:7.0, size:0.12, color:0x8888ff,
    type:'Space Telescope', badge:'badge-station',
    stats:{'Altitude':'547 km','Speed':'27,400 km/h','Orbit Period':'95 min','Mirror':'2.4 m','Launched':'1990','Weight':'11,110 kg','Pictures Taken':'1.5M+','Decommission':'~2030'},
    desc:'The Hubble Space Telescope — one of humanity\'s greatest scientific instruments. Over 1.5 million observations reshaped our understanding of the universe.' },
  { name:'James Webb', orbitPlanet:null, lagrangeL2:true, dist:0, speed:0, size:0.15, color:0xff6644,
    type:'Space Telescope', badge:'badge-station',
    stats:{'Location':'L2 Lagrange Point','Distance':'1.5M km','Mirror':'6.5 m','Launched':'2021','Cost':'$10B','Wavelength':'Infrared','Shield Size':'22×12 m','Orbit':'Halo orbit L2'},
    desc:'The James Webb Space Telescope — the most powerful space telescope ever built. It orbits the L2 Lagrange point 1.5 million km from Earth, looking back to the dawn of the universe.' },
  { name:'Gateway', orbitPlanet:'Moon', parentMoon:'Luna', dist:2.0, speed:3.0, size:0.2, color:0x44aaff,
    type:'Planned Station', badge:'badge-station',
    stats:{'Location':'Lunar orbit','Altitude':'~3,000 km','Purpose':'Artemis base','Status':'Planning phase','Modules':'4+','Crew':'4','Planned':'~2028','Partners':'NASA, ESA, JAXA, CSA'},
    desc:'Lunar Gateway — the planned space station orbiting the Moon. It will serve as a staging point for Artemis missions to the lunar surface and eventually deep space exploration.' }
];

// ── TOURS ──
const TOURS = [
  { name:'Solar Tour', steps:[
    {body:'The Sun',text:'Welcome to ASTRAL COMMAND. Our star contains 99.86% of the solar system\'s mass.'},
    {body:'Mercury',text:'Mercury — the closest planet to the Sun, with extreme temperature swings.'},
    {body:'Venus',text:'Venus — the hottest planet, shrouded in thick CO₂ clouds.'},
    {body:'Earth',text:'Earth — our pale blue dot, the only known world with life.'},
    {body:'Mars',text:'Mars — the Red Planet, target of human exploration.'},
    {body:'Jupiter',text:'Jupiter — the gas giant king, with its Great Red Spot storm.'},
    {body:'Saturn',text:'Saturn — jewel of the solar system with its spectacular rings.'},
    {body:'Uranus',text:'Uranus — the sideways planet, tilted 98° on its axis.'},
    {body:'Neptune',text:'Neptune — the windiest world, at the edge of the planets.'},
    {body:'Pluto',text:'Pluto — the dwarf planet, once the 9th planet, now at the frontier.'}
  ]},
  { name:'Inner Planets', steps:[
    {body:'Mercury',text:'The innermost world — cratered and airless.'},
    {body:'Venus',text:'Earth\'s evil twin — 465°C beneath crushing clouds.'},
    {body:'Earth',text:'Our home — blue oceans, green lands, white clouds.'},
    {body:'Mars',text:'The Red Planet — home of Olympus Mons and Valles Marineris.'}
  ]},
  { name:'Stations Tour', steps:[
    {body:'ISS',text:'The International Space Station — humanity\'s outpost since 2000.'},
    {body:'Tiangong',text:'China\'s Tiangong — the Heavenly Palace.'},
    {body:'Hubble',text:'Hubble — the telescope that changed everything.'},
    {body:'James Webb',text:'James Webb — looking back to the dawn of time.'},
    {body:'Gateway',text:'Gateway — our future stepping stone to the Moon and beyond.'}
  ]}
];

let currentTour = null, tourStep = 0;

// ── ACHIEVEMENTS ──
const ACHIEVEMENT_DEFS = {
  'first-contact':   {icon:'👽',title:'FIRST CONTACT',desc:'Clicked on your first celestial body'},
  'cartographer':    {icon:'🗺',title:'CARTOGRAPHER',desc:'Visited all 8 planets'},
  'deep-space':      {icon:'🌌',title:'DEEP SPACE',desc:'Found Pluto at the frontier'},
  'station-spotter': {icon:'🛰',title:'STATION SPOTTER',desc:'Found all 5 space stations'},
  'speed-demon':     {icon:'⚡',title:'SPEED DEMON',desc:'Reached maximum simulation speed'},
  'moon-hunter':     {icon:'🌑',title:'MOON HUNTER',desc:'Visited 5 or more moons'},
  'system-complete': {icon:'🏆',title:'SYSTEM COMPLETE',desc:'Visited every body in the system'}
};

// ── AUDIO ──
function initAudio() {
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  } catch(e) {}
}

function playClick() {
  if (!audioCtx || !soundEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 800 + Math.random()*400;
    gain.gain.value = 0.04 * soundVolume;
    osc.start(); osc.stop(audioCtx.currentTime + 0.05);
  } catch(e) {}
}

function playWhoosh() {
  if (!audioCtx || !soundEnabled) return;
  try {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain); gain.connect(audioCtx.destination);
    osc.type = 'sine'; osc.frequency.value = 200;
    osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.15);
    gain.gain.value = 0.06 * soundVolume;
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } catch(e) {}
}

function playAchievement() {
  if (!audioCtx || !soundEnabled) return;
  try {
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain); gain.connect(audioCtx.destination);
      osc.type = 'sine'; osc.frequency.value = f;
      gain.gain.value = 0.08 * soundVolume;
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + i*0.15 + 0.4);
      osc.start(audioCtx.currentTime + i*0.15);
      osc.stop(audioCtx.currentTime + i*0.15 + 0.4);
    });
  } catch(e) {}
}

// ── INIT ──
function init() {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x050510, 0.0015);
  camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 2000);
  camera.position.set(0, 40, 60);
  
  renderer = new THREE.WebGLRenderer({ antialias: qualityLevel!=='low', alpha:true, preserveDrawingBuffer:true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, qualityLevel==='high'?3:2));
  renderer.shadowMap.enabled = qualityLevel!=='low';
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.2;
  document.body.appendChild(renderer.domElement);
  
  clock = new THREE.Clock();
  raycaster = new THREE.Raycaster();
  mouseVec = new THREE.Vector2();
  
  updateLoadBar(20);
  
  // Lights
  sunLight = new THREE.PointLight(0xffeedd, 2, 500);
  sunLight.castShadow = true;
  scene.add(sunLight);
  ambientLight = new THREE.AmbientLight(0x111122, 0.3);
  scene.add(ambientLight);
  
  createStarfield();
  updateLoadBar(35);
  createSun();
  updateLoadBar(45);
  createPlanets();
  updateLoadBar(60);
  createDwarfPlanets();
  createComet();
  updateLoadBar(70);
  createAsteroidBelt();
  createKuiperBelt();
  createSpaceStations();
  updateLoadBar(85);
  setupControls();
  setupEvents();
  setupSearch();
  setupComparison();
  createLabels();
  updateLoadBar(95);
  
  initAudio();
  updateExploreBar();
  updateSpeedDisplay();
  
  setTimeout(() => {
    const loading = document.getElementById('loading');
    loading.classList.add('fade-out');
    setTimeout(() => loading.style.display = 'none', 800);
  }, 500);
  
  animate();
}

function updateLoadBar(pct) {
  const bar = document.getElementById('load-bar');
  if (bar) bar.style.width = pct + '%';
}

// ── STARFIELD ──
function createStarfield() {
  const counts = {low:4000, med:10000, high:18000};
  const count = counts[qualityLevel] || 10000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  const colors = new Float32Array(count*3);
  const sizes = new Float32Array(count);
  
  for (let i=0; i<count; i++) {
    const r = 400 + Math.random()*600;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    pos[i*3] = r*Math.sin(phi)*Math.cos(theta);
    pos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    pos[i*3+2] = r*Math.cos(phi);
    
    const temp = Math.random();
    if (temp>0.9) { colors[i*3]=1; colors[i*3+1]=0.8; colors[i*3+2]=0.6; }
    else if (temp>0.7) { colors[i*3]=0.7; colors[i*3+1]=0.8; colors[i*3+2]=1; }
    else { colors[i*3]=0.9; colors[i*3+1]=0.9; colors[i*3+2]=1; }
    
    sizes[i] = 0.3 + Math.random()*1.5;
  }
  
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color', new THREE.BufferAttribute(colors,3));
  starField = new THREE.Points(geo, new THREE.PointsMaterial({size:0.8,vertexColors:true,transparent:true,opacity:0.9,sizeAttenuation:true}));
  scene.add(starField);
}

// ── SUN ──
function createSun() {
  const geo = new THREE.SphereGeometry(SUN_DATA.radius, 64, 64);
  const mat = new THREE.MeshBasicMaterial({color:0xffcc44});
  const sun = new THREE.Mesh(geo, mat);
  sun.userData = {...SUN_DATA, bodyType:'star'};
  scene.add(sun);
  allBodies.push(sun);
  
  // Glow layers
  for (let i=1; i<=5; i++) {
    const glowGeo = new THREE.SphereGeometry(SUN_DATA.radius + i*0.7, 32, 32);
    const glowMat = new THREE.MeshBasicMaterial({
      color: i<3 ? 0xff8800 : 0xff4400,
      transparent:true, opacity: 0.06/i, side: THREE.BackSide
    });
    scene.add(new THREE.Mesh(glowGeo, glowMat));
  }
  
  // Corona
  const coronaGeo = new THREE.SphereGeometry(SUN_DATA.radius + 4, 32, 32);
  scene.add(new THREE.Mesh(coronaGeo, new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:0.02,side:THREE.BackSide})));
  
  // Solar flare particles
  const flareGeo = new THREE.BufferGeometry();
  const flareCount = qualityLevel==='low'?200:500;
  const flarePos = new Float32Array(flareCount*3);
  for (let i=0; i<flareCount; i++) {
    const r = SUN_DATA.radius + 0.5 + Math.random()*5;
    const theta = Math.random()*Math.PI*2;
    const phi = Math.acos(2*Math.random()-1);
    flarePos[i*3] = r*Math.sin(phi)*Math.cos(theta);
    flarePos[i*3+1] = r*Math.sin(phi)*Math.sin(theta);
    flarePos[i*3+2] = r*Math.cos(phi);
  }
  flareGeo.setAttribute('position', new THREE.BufferAttribute(flarePos,3));
  scene.add(new THREE.Points(flareGeo, new THREE.PointsMaterial({color:0xffaa44,size:0.3,transparent:true,opacity:0.4})));
}

// ── PLANETS ──
function createPlanets() {
  PLANET_DATA.forEach(data => {
    const planet = createPlanet(data);
    planets.push(planet);
    allBodies.push(planet.mesh);
    
    if (data.name === 'Earth') {
      planet.moons = [createMoon({name:'Luna',radius:0.27,dist:2.5,speed:3.0,color:0xcccccc,type:'Moon'}, planet)];
    }
    if (data.moonData) {
      planet.moons = (planet.moons||[]).concat(data.moonData.map(md => createMoon(md, planet)));
    }
  });
}

function createPlanet(data) {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(data.radius, 48, 48);
  const mat = new THREE.MeshStandardMaterial({color:data.color, roughness:0.7, metalness:0.1});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true; mesh.receiveShadow = true;
  mesh.userData = {...data, bodyType:'planet'};
  group.add(mesh);
  
  // Procedural textures
  if (data.name === 'Mercury') applyMercuryTex(mat);
  if (data.name === 'Venus') applyVenusTex(mat);
  if (data.name === 'Earth') applyEarthTex(mat, group, data);
  if (data.name === 'Mars') applyMarsTex(mat);
  if (data.name === 'Jupiter') applyJupiterTex(mat);
  if (data.name === 'Saturn') applySaturnTex(mat);
  if (data.name === 'Uranus') applyUranusTex(mat);
  if (data.name === 'Neptune') applyNeptuneTex(mat);
  
  // Rings
  if (data.name === 'Saturn') {
    const ring = createRing(data.radius*1.4, data.radius*1.9, 0xd4b896, 0.5);
    ring.rotation.x = 0.5; group.add(ring);
    const ring2 = createRing(data.radius*2.0, data.radius*2.8, 0xc4a886, 0.3);
    ring2.rotation.x = 0.5; group.add(ring2);
  }
  if (data.name === 'Uranus') {
    const ring = createRing(data.radius*1.3, data.radius*2.0, 0x88aacc, 0.2);
    ring.rotation.x = Math.PI/2 - 0.2; group.add(ring);
  }
  
  // Atmosphere glow
  if (data.hasAtmosphere) {
    const atmoGeo = new THREE.SphereGeometry(data.radius*1.03, 48, 48);
    const atmoMat = new THREE.MeshBasicMaterial({
      color: data.name==='Earth'?0x88bbff : data.name==='Venus'?0xddcc88 : data.name==='Jupiter'?0xddbb88 : data.name==='Saturn'?0xddccaa : 0x4466cc,
      transparent:true, opacity:0.12, side:THREE.BackSide
    });
    group.add(new THREE.Mesh(atmoGeo, atmoMat));
  }
  
  // Orbit line
  const orbitGeo = new THREE.BufferGeometry();
  const orbitPoints = [];
  for (let i=0; i<=128; i++) {
    const angle = (i/128)*Math.PI*2;
    orbitPoints.push(new THREE.Vector3(Math.cos(angle)*data.dist, 0, Math.sin(angle)*data.dist));
  }
  orbitGeo.setFromPoints(orbitPoints);
  const orbitLine = new THREE.Line(orbitGeo, new THREE.LineBasicMaterial({color:0x00997F,transparent:true,opacity:0.2}));
  scene.add(orbitLine);
  
  mesh.rotation.z = data.tilt || 0;
  
  const planetObj = {
    mesh, group, data, orbitLine, moons:[],
    angle: Math.random()*Math.PI*2,
    update(dt) {
      if (!paused) this.angle += data.speed * dt * 0.1 * simSpeed;
      this.group.position.x = Math.cos(this.angle)*data.dist;
      this.group.position.z = Math.sin(this.angle)*data.dist;
      if (!paused) mesh.rotation.y += data.rotSpeed * dt * simSpeed;
      this.moons.forEach(m => m.update(dt));
    }
  };
  
  scene.add(group);
  return planetObj;
}

// ── Procedural Textures ──
function applyMercuryTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#b0b0b0'; ctx.fillRect(0,0,512,256);
  for (let i=0;i<30;i++) { ctx.fillStyle=`rgba(80,80,80,${0.2+Math.random()*0.3})`; ctx.beginPath(); ctx.arc(Math.random()*512,Math.random()*256,3+Math.random()*15,0,Math.PI*2); ctx.fill(); }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyVenusTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  for (let y=0;y<256;y++) { ctx.fillStyle=`hsl(40,${30+Math.sin(y*0.1)*10}%,${70+Math.sin(y*0.05)*10}%)`; ctx.fillRect(0,y,512,1); }
  for (let i=0;i<15;i++) { ctx.fillStyle='rgba(255,255,230,0.15)'; ctx.beginPath(); ctx.ellipse(Math.random()*512,Math.random()*256,30+Math.random()*50,5+Math.random()*10,0,0,Math.PI*2); ctx.fill(); }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyEarthTex(mat, group, data) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#2266aa'; ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#44aa44';
  [[120,60,80,50],[280,50,60,40],[320,80,40,60],[200,120,50,40],[80,100,40,50],[350,40,80,30],[150,160,30,40],[400,70,50,40]].forEach(([x,y,w,h]) => { ctx.beginPath(); ctx.ellipse(x+w/2,y+h/2,w/2,h/2,0,0,Math.PI*2); ctx.fill(); });
  ctx.fillStyle='#ddeeff'; ctx.fillRect(0,0,512,15); ctx.fillRect(0,241,512,15);
  ctx.fillStyle='rgba(255,255,255,0.2)';
  for (let i=0;i<20;i++) { ctx.beginPath(); ctx.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,5+Math.random()*10,0,0,Math.PI*2); ctx.fill(); }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyMarsTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  ctx.fillStyle='#cc5533'; ctx.fillRect(0,0,512,256);
  ctx.fillStyle='#eeddcc'; ctx.fillRect(0,0,512,20); ctx.fillRect(0,236,512,20);
  ctx.fillStyle='#993322';
  for (let i=0;i<8;i++) { ctx.beginPath(); ctx.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,10+Math.random()*20,0,0,Math.PI*2); ctx.fill(); }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyJupiterTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  for (let y=0;y<256;y++) {
    const band = Math.sin(y*0.1)*0.5+Math.sin(y*0.05+1)*0.3;
    ctx.fillStyle=`rgb(${Math.floor(180+band*50)},${Math.floor(140+band*40)},${Math.floor(100+band*30)})`;
    ctx.fillRect(0,y,512,1);
  }
  ctx.fillStyle='#cc5533'; ctx.beginPath(); ctx.ellipse(200,150,30,15,0,0,Math.PI*2); ctx.fill();
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applySaturnTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  for (let y=0;y<256;y++) {
    const band = Math.sin(y*0.08)*0.4+Math.sin(y*0.03)*0.2;
    ctx.fillStyle=`rgb(${Math.floor(210+band*30)},${Math.floor(190+band*25)},${Math.floor(150+band*20)})`;
    ctx.fillRect(0,y,512,1);
  }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyUranusTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  for (let y=0;y<256;y++) {
    const band = Math.sin(y*0.06)*0.2;
    ctx.fillStyle=`rgb(${Math.floor(120+band*15)},${Math.floor(190+band*10)},${Math.floor(205+band*10)})`;
    ctx.fillRect(0,y,512,1);
  }
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}
function applyNeptuneTex(mat) {
  const c = document.createElement('canvas'); c.width=512; c.height=256;
  const ctx = c.getContext('2d');
  for (let y=0;y<256;y++) {
    const band = Math.sin(y*0.07)*0.3;
    ctx.fillStyle=`rgb(${Math.floor(40+band*15)},${Math.floor(70+band*15)},${Math.floor(190+band*20)})`;
    ctx.fillRect(0,y,512,1);
  }
  // Great Dark Spot
  ctx.fillStyle='rgba(20,40,120,0.4)'; ctx.beginPath(); ctx.ellipse(180,120,25,12,0,0,Math.PI*2); ctx.fill();
  mat.map = new THREE.CanvasTexture(c); mat.needsUpdate=true;
}

function createRing(inner, outer, color, opacity) {
  const ringGeo = new THREE.RingGeometry(inner, outer, 64);
  const ringMat = new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide});
  return new THREE.Mesh(ringGeo, ringMat);
}

// ── DWARF PLANETS ──
function createDwarfPlanets() {
  DWARF_DATA.forEach(data => {
    const dwarf = createPlanet({...data, hasAtmosphere:false, hasRing:false});
    dwarf.mesh.userData = {...data, bodyType:'dwarf'};
    // Rename for nav
    planets.push(dwarf);
  });
}

// ── MOONS ──
function createMoon(data, parent) {
  const geo = new THREE.SphereGeometry(data.radius, 24, 24);
  const mat = new THREE.MeshStandardMaterial({color:data.color, roughness:0.8});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.castShadow = true;
  const moonInfo = {
    name:data.name, type:'Moon', badge:'badge-moon', bodyType:'moon',
    stats:{'Parent':parent.data.name,'Orbit':'Near ' + parent.data.name},
    desc:`A moon orbiting ${parent.data.name}.`,
    facts:[`${data.name} orbits ${parent.data.name}.`]
  };
  mesh.userData = moonInfo;
  allBodies.push(mesh);
  parent.group.add(mesh);
  moons.push(mesh);
  
  return {
    mesh, angle: Math.random()*Math.PI*2,
    update(dt) {
      if (!paused) this.angle += data.speed * dt * 0.1 * simSpeed;
      this.mesh.position.x = Math.cos(this.angle)*data.dist;
      this.mesh.position.z = Math.sin(this.angle)*data.dist;
    }
  };
}

// ── COMET ──
let cometObj = null;
function createComet() {
  const group = new THREE.Group();
  const geo = new THREE.SphereGeometry(COMET_DATA.radius, 16, 16);
  const mat = new THREE.MeshBasicMaterial({color:0xaaddff});
  const mesh = new THREE.Mesh(geo, mat);
  mesh.userData = {...COMET_DATA, bodyType:'comet'};
  group.add(mesh);
  
  // Tail
  const tailCount = qualityLevel==='low'?100:300;
  const tailGeo = new THREE.BufferGeometry();
  const tailPos = new Float32Array(tailCount*3);
  for (let i=0; i<tailCount; i++) {
    tailPos[i*3] = -Math.random()*8;
    tailPos[i*3+1] = (Math.random()-0.5)*0.5;
    tailPos[i*3+2] = (Math.random()-0.5)*0.5;
  }
  tailGeo.setAttribute('position', new THREE.BufferAttribute(tailPos,3));
  const tail = new THREE.Points(tailGeo, new THREE.PointsMaterial({color:0x88ccff,size:0.15,transparent:true,opacity:0.5}));
  group.add(tail);
  
  allBodies.push(mesh);
  cometObj = {
    mesh, group, tail, angle: 0,
    update(dt) {
      if (!paused) this.angle += COMET_DATA.speed * dt * 0.1 * simSpeed;
      const a = this.angle;
      const e = COMET_DATA.eccentricity;
      const r = COMET_DATA.perihelion * (1 + e) / (1 + e * Math.cos(a));
      this.group.position.x = Math.cos(a) * r;
      this.group.position.z = Math.sin(a) * r;
      // Tail always points away from sun
      const toSun = new THREE.Vector3(-this.group.position.x, 0, -this.group.position.z).normalize();
      this.tail.rotation.y = Math.atan2(toSun.x, toSun.z);
      this.group.visible = cometVisible;
    }
  };
  scene.add(group);
}

// ── ASTEROID BELT ──
function createAsteroidBelt() {
  const count = qualityLevel==='low'?800:2000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  for (let i=0; i<count; i++) {
    const angle = Math.random()*Math.PI*2;
    const dist = 34 + Math.random()*8 + Math.sin(angle*3)*1;
    pos[i*3] = Math.cos(angle)*dist;
    pos[i*3+1] = (Math.random()-0.5)*1.5;
    pos[i*3+2] = Math.sin(angle)*dist;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const belt = new THREE.Points(geo, new THREE.PointsMaterial({color:0x887766,size:0.12,transparent:true,opacity:0.5}));
  scene.add(belt);
  asteroids.push(belt);
}
let asteroids = [];

function createKuiperBelt() {
  const count = qualityLevel==='low'?800:2000;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(count*3);
  for (let i=0; i<count; i++) {
    const angle = Math.random()*Math.PI*2;
    const dist = 90 + Math.random()*40;
    pos[i*3] = Math.cos(angle)*dist;
    pos[i*3+1] = (Math.random()-0.5)*4;
    pos[i*3+2] = Math.sin(angle)*dist;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos,3));
  const belt = new THREE.Points(geo, new THREE.PointsMaterial({color:0x667788,size:0.08,transparent:true,opacity:0.35}));
  scene.add(belt);
  asteroids.push(belt);
}

// ── SPACE STATIONS ──
function createSpaceStations() {
  STATION_DATA.forEach(data => {
    const station = createStation(data);
    stationObjs.push(station);
    allBodies.push(station.mesh);
  });
}

function createStation(data) {
  const group = new THREE.Group();
  const bodyGeo = new THREE.BoxGeometry(data.size, data.size*0.4, data.size*0.4);
  const bodyMat = new THREE.MeshStandardMaterial({color:data.color, metalness:0.8, roughness:0.2});
  group.add(new THREE.Mesh(bodyGeo, bodyMat));
  
  if (data.name !== 'James Webb') {
    const panelGeo = new THREE.BoxGeometry(data.size*1.5, data.size*0.02, data.size*0.6);
    const panelMat = new THREE.MeshStandardMaterial({color:0x2244aa, metalness:0.5, roughness:0.3});
    const pL = new THREE.Mesh(panelGeo, panelMat); pL.position.x=data.size*1.0; group.add(pL);
    const pR = pL.clone(); pR.position.x=-data.size*1.0; group.add(pR);
  }
  if (data.name === 'James Webb') {
    const shieldGeo = new THREE.BoxGeometry(data.size*2, data.size*0.02, data.size*1.5);
    const shield = new THREE.Mesh(shieldGeo, new THREE.MeshStandardMaterial({color:0xdd8855,metalness:0.3,roughness:0.5}));
    shield.rotation.y=Math.PI/4; group.add(shield);
  }
  
  const lightGeo = new THREE.SphereGeometry(data.size*0.05,8,8);
  const blinkLight = new THREE.Mesh(lightGeo, new THREE.MeshBasicMaterial({color:0xff0000}));
  blinkLight.position.y=data.size*0.25; group.add(blinkLight);
  
  group.userData = {...data, bodyType:'station', blinkLight};
  
  let parentObj = null;
  if (data.orbitPlanet) parentObj = planets.find(p => p.data.name === data.orbitPlanet);
  
  const stationObj = {
    mesh: group, data, parentObj, angle: Math.random()*Math.PI*2,
    update(dt) {
      if (!paused) this.angle += (data.speed||0.5)*dt*0.1*simSpeed;
      if (data.lagrangeL2) {
        const earth = planets.find(p => p.data.name === 'Earth');
        if (earth) { this.mesh.position.x=earth.group.position.x+3; this.mesh.position.y=1; this.mesh.position.z=earth.group.position.z; }
      } else if (this.parentObj) {
        this.mesh.position.x = this.parentObj.group.position.x + Math.cos(this.angle)*data.dist;
        this.mesh.position.z = this.parentObj.group.position.z + Math.sin(this.angle)*data.dist;
        this.mesh.position.y = Math.sin(this.angle*0.3)*0.2;
      }
      this.mesh.visible = stationsVisible;
      if (blinkLight && Math.sin(simTime*3)>0.7) blinkLight.material.color.setHex(0xff0000);
      else if (blinkLight) blinkLight.material.color.setHex(0x330000);
      if (!paused) this.mesh.rotation.y += dt*0.5*simSpeed;
    }
  };
  scene.add(group);
  return stationObj;
}

// ── LABELS ──
function createLabels() {
  const container = document.getElementById('labels-container');
  const allNames = [...PLANET_DATA.map(p=>p.name), 'The Sun', ...DWARF_DATA.map(d=>d.name), 'Halley'];
  allNames.forEach(name => {
    const el = document.createElement('div');
    el.className = 'planet-label';
    el.id = 'label-'+name.replace(/\s/g,'-');
    el.textContent = name.toUpperCase();
    container.appendChild(el);
    labelElements.push({name, el});
  });
}

function updateLabels() {
  labelElements.forEach(({name, el}) => {
    let body = allBodies.find(b => b.userData && b.userData.name === name);
    if (!body) return;
    
    let pos = new THREE.Vector3();
    if (body.userData.bodyType === 'planet' || body.userData.bodyType === 'dwarf') {
      const p = planets.find(p => p.data.name === name);
      if (p) pos.copy(p.group.position);
    } else if (body.userData.bodyType === 'star') {
      pos.set(0,0,0);
    } else return;
    
    pos.y += ((body.userData.radius || 1) * 1.5 + 1);
    pos.project(camera);
    
    if (pos.z > 1) { el.classList.remove('show'); return; }
    
    const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
    
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    el.classList.toggle('show', labelsVisible);
  });
}

// ── CAMERA CONTROLS ──
function setupControls() {
  const canvas = renderer.domElement;
  canvas.addEventListener('mousedown', e => { isDragging=true; prevMouse={x:e.clientX,y:e.clientY}; });
  canvas.addEventListener('mousemove', e => {
    if (isDragging) {
      const sens = cameraSensitivity * 0.001;
      camTheta -= (e.clientX-prevMouse.x) * sens;
      camPhi = Math.max(0.1, Math.min(Math.PI-0.1, camPhi - (e.clientY-prevMouse.y) * sens));
      prevMouse = {x:e.clientX,y:e.clientY};
    }
    mouseVec.x = (e.clientX/window.innerWidth)*2-1;
    mouseVec.y = -(e.clientY/window.innerHeight)*2+1;
  });
  canvas.addEventListener('mouseup', () => isDragging=false);
  canvas.addEventListener('wheel', e => {
    camDist *= 1 + e.deltaY*0.001;
    camDist = Math.max(5, Math.min(500, camDist));
    targetCamDist = camDist;
  });
  
  canvas.addEventListener('touchstart', e => { if (e.touches.length===1) { isDragging=true; prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY}; } });
  canvas.addEventListener('touchmove', e => { if (isDragging && e.touches.length===1) { const dx=e.touches[0].clientX-prevMouse.x; const dy=e.touches[0].clientY-prevMouse.y; camTheta-=dx*0.005; camPhi=Math.max(0.1,Math.min(Math.PI-0.1,camPhi-dy*0.005)); prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY}; } });
  canvas.addEventListener('touchend', () => isDragging=false);
  
  canvas.addEventListener('dblclick', () => {
    raycaster.setFromCamera(mouseVec, camera);
    const hits = raycaster.intersectObjects(allBodies, true);
    if (hits.length > 0) { let obj=hits[0].object; while(obj.parent && !obj.userData.name) obj=obj.parent; if(obj.userData.name) focusBody(obj); }
  });
}

function focusBody(obj) {
  followTarget = obj;
  targetCamDist = (obj.userData.radius || 2) * 5 + 3;
  document.getElementById('btn-follow').classList.add('active');
  showInfo(obj.userData);
  markVisited(obj.userData.name);
  playWhoosh();
}

function navigateToBody(name) {
  const body = allBodies.find(b => b.userData && b.userData.name === name);
  if (body) focusBody(body);
}

// ── EVENTS ──
function setupEvents() {
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
  
  renderer.domElement.addEventListener('click', e => {
    raycaster.setFromCamera(mouseVec, camera);
    const hits = raycaster.intersectObjects(allBodies, true);
    if (hits.length > 0) {
      let obj = hits[0].object;
      while (obj.parent && !obj.userData.name) obj = obj.parent;
      if (obj.userData.name) { showInfo(obj.userData); markVisited(obj.userData.name); playClick(); }
    } else {
      document.getElementById('info-panel').classList.remove('visible');
    }
  });
  
  // Buttons
  document.getElementById('btn-pause').onclick = () => { paused=!paused; document.getElementById('btn-pause').textContent=paused?'▶':'⏸'; document.getElementById('btn-pause').classList.toggle('active',!paused); playClick(); };
  document.getElementById('btn-slower').onclick = () => { simSpeed=Math.max(0.1,simSpeed/2); updateSpeedDisplay(); playClick(); };
  document.getElementById('btn-faster').onclick = () => { simSpeed=Math.min(50,simSpeed*2); updateSpeedDisplay(); if(simSpeed>=50) unlockAchievement('speed-demon'); playClick(); };
  document.getElementById('btn-orbits').onclick = () => { orbitsVisible=!orbitsVisible; planets.forEach(p=>p.orbitLine.visible=orbitsVisible); document.getElementById('btn-orbits').classList.toggle('active',orbitsVisible); playClick(); };
  document.getElementById('btn-labels').onclick = () => { labelsVisible=!labelsVisible; document.getElementById('btn-labels').classList.toggle('active',labelsVisible); playClick(); };
  document.getElementById('btn-follow').onclick = () => { if(followTarget){followTarget=null;document.getElementById('btn-follow').classList.remove('active');} playClick(); };
  document.getElementById('btn-stations').onclick = () => { stationsVisible=!stationsVisible; document.getElementById('btn-stations').classList.toggle('active',stationsVisible); playClick(); };
  document.getElementById('btn-comet').onclick = () => { cometVisible=!cometVisible; document.getElementById('btn-comet').classList.toggle('active',cometVisible); playClick(); };
  document.getElementById('btn-compare').onclick = () => { document.getElementById('comparison').classList.toggle('visible'); playClick(); };
  document.getElementById('btn-fullscreen').onclick = () => { if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen(); playClick(); };
  document.getElementById('btn-screenshot').onclick = () => { takeScreenshot(); playClick(); };
  document.getElementById('btn-keyboard').onclick = () => { document.getElementById('shortcuts').classList.toggle('visible'); playClick(); };
  document.getElementById('close-info').onclick = () => { document.getElementById('info-panel').classList.remove('visible'); };
  
  // Tour
  document.getElementById('btn-tour').onclick = () => { startTour(0); playClick(); };
  document.getElementById('tour-next').onclick = () => advanceTour(1);
  document.getElementById('tour-prev').onclick = () => advanceTour(-1);
  document.getElementById('tour-end').onclick = () => endTour();
  
  // Nav items
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      const name = item.dataset.name;
      navigateToBody(name);
      document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));
      item.classList.add('active');
      playClick();
    });
  });
  
  // Keyboard
  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
    const key = e.key;
    if (key === 'Escape') { followTarget=null; document.getElementById('btn-follow').classList.remove('active'); document.getElementById('info-panel').classList.remove('visible'); document.getElementById('shortcuts').classList.remove('visible'); document.getElementById('comparison').classList.remove('visible'); endTour(); }
    if (key === ' ') { e.preventDefault(); paused=!paused; document.getElementById('btn-pause').textContent=paused?'▶':'⏸'; }
    if (key === '+' || key === '=') { simSpeed=Math.min(50,simSpeed*1.5); updateSpeedDisplay(); }
    if (key === '-') { simSpeed=Math.max(0.1,simSpeed/1.5); updateSpeedDisplay(); }
    if (key === '1') navigateToBody('Mercury');
    if (key === '2') navigateToBody('Venus');
    if (key === '3') navigateToBody('Earth');
    if (key === '4') navigateToBody('Mars');
    if (key === '5') navigateToBody('Jupiter');
    if (key === '6') navigateToBody('Saturn');
    if (key === '7') navigateToBody('Uranus');
    if (key === '8') navigateToBody('Neptune');
    if (key === '0') navigateToBody('The Sun');
    if (key === 'o' || key === 'O') { orbitsVisible=!orbitsVisible; planets.forEach(p=>p.orbitLine.visible=orbitsVisible); }
    if (key === 'l' || key === 'L') { labelsVisible=!labelsVisible; }
    if (key === 'f' || key === 'F') { if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen(); }
    if (key === 's' || key === 'S') takeScreenshot();
    if (key === 'c' || key === 'C') document.getElementById('comparison').classList.toggle('visible');
    if (key === 't' || key === 'T') startTour(0);
    if (key === '?') document.getElementById('shortcuts').classList.toggle('visible');
  });
  
  // Settings
  document.getElementById('set-quality').onchange = e => { qualityLevel=e.target.value; };
  document.getElementById('set-sound').oninput = e => { soundVolume=e.target.value/100; };
  document.getElementById('set-sensitivity').oninput = e => { cameraSensitivity=parseInt(e.target.value); };
}

// ── SEARCH ──
function setupSearch() {
  const input = document.getElementById('search-input');
  const dropdown = document.getElementById('search-dropdown');
  
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase().trim();
    if (!q) { dropdown.classList.remove('show'); return; }
    
    const matches = allBodies.filter(b => b.userData && b.userData.name && b.userData.name.toLowerCase().includes(q)).slice(0, 8);
    if (!matches.length) { dropdown.classList.remove('show'); return; }
    
    dropdown.innerHTML = matches.map(b => `<div class="search-item" data-name="${b.userData.name}"><span class="nav-dot" style="background:${b.userData.navColor||'#888'};width:6px;height:6px;border-radius:50%;display:inline-block;"></span> <span>${b.userData.name}</span> <span class="si-type">${b.userData.type||''}</span></div>`).join('');
    dropdown.classList.add('show');
    
    dropdown.querySelectorAll('.search-item').forEach(item => {
      item.addEventListener('click', () => {
        navigateToBody(item.dataset.name);
        input.value = '';
        dropdown.classList.remove('show');
      });
    });
  });
  
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const q = input.value.toLowerCase().trim();
      const match = allBodies.find(b => b.userData && b.userData.name && b.userData.name.toLowerCase().includes(q));
      if (match) { focusBody(match); input.value=''; dropdown.classList.remove('show'); }
    }
    if (e.key === 'Escape') { input.value=''; dropdown.classList.remove('show'); }
  });
  
  document.addEventListener('click', e => { if (!e.target.closest('#search-container')) dropdown.classList.remove('show'); });
}

// ── COMPARISON ──
function setupComparison() {
  const selectA = document.getElementById('comp-a');
  const selectB = document.getElementById('comp-b');
  const bodyNames = ['The Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Ceres'];
  bodyNames.forEach(name => {
    selectA.innerHTML += `<option value="${name}">${name}</option>`;
    selectB.innerHTML += `<option value="${name}">${name}</option>`;
  });
  selectB.value = 'Jupiter';
  
  function updateComp() {
    const a = findDataFor(selectA.value);
    const b = findDataFor(selectB.value);
    if (!a || !b) return;
    const keys = Object.keys(a.stats).filter(k => b.stats[k]);
    document.getElementById('comp-stats').innerHTML = keys.map(k => `<div class="comp-row"><span class="comp-label">${k}</span><span class="comp-a">${a.stats[k]}</span><span class="comp-b">${b.stats[k]}</span></div>`).join('');
  }
  selectA.onchange = updateComp;
  selectB.onchange = updateComp;
  updateComp();
}

function findDataFor(name) {
  const all = [SUN_DATA, ...PLANET_DATA, ...DWARF_DATA];
  return all.find(d => d.name === name);
}

// ── INFO PANEL ──
function showInfo(data) {
  document.getElementById('info-name').textContent = data.name;
  const badge = document.getElementById('info-type-badge');
  badge.textContent = data.type || '';
  badge.className = data.badge || 'badge-planet';
  
  let statsHtml = '';
  if (data.stats) Object.entries(data.stats).forEach(([label,value]) => { statsHtml += `<div class="stat-row"><span class="stat-label">${label}</span><span class="stat-value">${value}</span></div>`; });
  document.getElementById('info-stats').innerHTML = statsHtml;
  document.getElementById('info-desc').textContent = data.desc || '';
  
  // Fun fact
  if (data.facts && data.facts.length) {
    const fact = data.facts[Math.floor(Math.random()*data.facts.length)];
    document.getElementById('info-fact').innerHTML = `<span class="fact-label">◈ FUN FACT</span><br>${fact}`;
  } else {
    document.getElementById('info-fact').innerHTML = '';
  }
  
  document.getElementById('info-panel').classList.add('visible');
}

// ── TOUR ──
function startTour(tourIdx) {
  currentTour = TOURS[tourIdx];
  tourStep = 0;
  showTourStep();
  document.getElementById('tour-overlay').classList.add('visible');
}

function advanceTour(dir) {
  tourStep += dir;
  if (tourStep < 0) tourStep = 0;
  if (tourStep >= currentTour.steps.length) { endTour(); return; }
  showTourStep();
}

function showTourStep() {
  const step = currentTour.steps[tourStep];
  document.getElementById('tour-step').textContent = `STEP ${tourStep+1} / ${currentTour.steps.length}`;
  document.getElementById('tour-title').textContent = step.body.toUpperCase();
  document.getElementById('tour-desc').textContent = step.text;
  navigateToBody(step.body);
}

function endTour() {
  currentTour = null;
  document.getElementById('tour-overlay').classList.remove('visible');
  if (visitedBodies.size > 5) unlockAchievement('system-complete');
}

// ── EXPLORATION ──
function markVisited(name) {
  if (visitedBodies.has(name)) return;
  visitedBodies.add(name);
  
  const navItem = document.querySelector(`.nav-item[data-name="${name}"]`);
  if (navItem) navItem.classList.add('visited');
  
  updateExploreBar();
  
  // Achievement checks
  if (visitedBodies.size === 1) unlockAchievement('first-contact');
  
  const planetNames = PLANET_DATA.map(p=>p.name);
  if (planetNames.every(n=>visitedBodies.has(n))) unlockAchievement('cartographer');
  
  if (name === 'Pluto') unlockAchievement('deep-space');
  
  const stationNames = STATION_DATA.map(s=>s.name);
  if (stationNames.every(n=>visitedBodies.has(n))) unlockAchievement('station-spotter');
  
  const moonCount = [...visitedBodies].filter(n => moons.some(m => m.userData.name === n)).length;
  if (moonCount >= 5) unlockAchievement('moon-hunter');
  
  const allNames = [...allBodies.map(b=>b.userData?.name).filter(Boolean)];
  if (allNames.every(n=>visitedBodies.has(n))) unlockAchievement('system-complete');
}

function updateExploreBar() {
  const total = allBodies.filter(b=>b.userData&&b.userData.name).length;
  const visited = visitedBodies.size;
  const pct = total > 0 ? (visited/total*100) : 0;
  document.getElementById('exp-fill').style.width = pct + '%';
  document.getElementById('exp-text').textContent = `${visited} / ${total} EXPLORED`;
}

// ── ACHIEVEMENTS ──
function unlockAchievement(id) {
  if (achievements[id]) return;
  achievements[id] = true;
  const def = ACHIEVEMENT_DEFS[id];
  if (!def) return;
  
  document.getElementById('ach-icon').textContent = def.icon;
  document.getElementById('ach-title').textContent = def.title;
  document.getElementById('ach-desc').textContent = def.desc;
  
  const el = document.getElementById('achievement');
  el.classList.add('show');
  playAchievement();
  showToast(`🏆 ${def.title} unlocked!`);
  
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ── TOAST ──
function showToast(msg) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  document.getElementById('toast-container').appendChild(el);
  setTimeout(() => el.remove(), 3500);
}

// ── SCREENSHOT ──
function takeScreenshot() {
  renderer.render(scene, camera);
  const link = document.createElement('a');
  link.download = `astral-command-${Date.now()}.png`;
  link.href = renderer.domElement.toDataURL('image/png');
  link.click();
  showToast('📷 Screenshot saved');
}

// ── SPEED DISPLAY ──
function updateSpeedDisplay() {
  document.getElementById('speed-display').textContent = `SPEED: ${simSpeed.toFixed(1)}×`;
}

// ── MINIMAP ──
function drawMinimap() {
  const canvas = document.getElementById('minimap-canvas');
  const ctx = canvas.getContext('2d');
  const cx = 90, cy = 90, scale = 0.75;
  
  ctx.fillStyle = 'rgba(5,5,16,0.9)';
  ctx.fillRect(0,0,180,180);
  
  ctx.fillStyle = '#FFB800';
  ctx.beginPath(); ctx.arc(cx,cy,3,0,Math.PI*2); ctx.fill();
  
  planets.forEach(p => {
    if (!p.data.dist) return;
    const dist = p.data.dist * scale;
    ctx.strokeStyle = 'rgba(0,255,212,0.1)';
    ctx.beginPath(); ctx.arc(cx,cy,dist,0,Math.PI*2); ctx.stroke();
    
    const x = cx + Math.cos(p.angle)*dist;
    const y = cy + Math.sin(p.angle)*dist;
    const col = '#' + p.data.color.toString(16).padStart(6,'0');
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x,y,Math.max(1.5, p.data.radius*0.8),0,Math.PI*2); ctx.fill();
  });
  
  // Focus indicator
  if (followTarget) {
    const fp = planets.find(p => p.mesh === followTarget);
    if (fp) {
      const x = cx + Math.cos(fp.angle)*fp.data.dist*scale;
      const y = cy + Math.sin(fp.angle)*fp.data.dist*scale;
      ctx.strokeStyle = '#00FFD4';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x,y,5,0,Math.PI*2); ctx.stroke();
      ctx.lineWidth = 1;
    }
  }
}

// ── MAIN LOOP ──
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.05);
  
  if (!paused) simTime += dt * simSpeed;
  
  const days = Math.floor(simTime * 10);
  const years = Math.floor(days / 365);
  const remDays = days % 365;
  document.getElementById('sim-time').textContent = years > 0 ? `DAY ${remDays} · YEAR ${years+1}` : `DAY ${days}`;
  
  planets.forEach(p => p.update(dt));
  stationObjs.forEach(s => s.update(dt));
  if (cometObj) cometObj.update(dt);
  
  if (asteroids[0] && !paused) asteroids[0].rotation.y += dt * 0.01 * simSpeed;
  if (asteroids[1] && !paused) asteroids[1].rotation.y -= dt * 0.005 * simSpeed;
  
  // Follow
  if (followTarget) {
    const fp = planets.find(p => p.mesh === followTarget);
    if (fp) targetCamTarget.copy(fp.group.position);
    else if (followTarget.position) targetCamTarget.copy(followTarget.position);
    else targetCamTarget.set(0,0,0);
  } else {
    targetCamTarget.set(0,0,0);
  }
  camTarget.lerp(targetCamTarget, 0.05);
  camDist += (targetCamDist - camDist) * 0.05;
  
  // Camera
  camera.position.x = camTarget.x + Math.sin(camPhi)*Math.cos(camTheta)*camDist;
  camera.position.y = camTarget.y + Math.cos(camPhi)*camDist;
  camera.position.z = camTarget.z + Math.sin(camPhi)*Math.sin(camTheta)*camDist;
  camera.lookAt(camTarget);
  
  // Coordinates
  document.getElementById('coord-display').textContent = `X:${camera.position.x.toFixed(0)} Y:${camera.position.y.toFixed(0)} Z:${camera.position.z.toFixed(0)}`;
  
  renderer.render(scene, camera);
  
  drawMinimap();
  updateLabels();
}

// ── START ──
window.addEventListener('load', init);