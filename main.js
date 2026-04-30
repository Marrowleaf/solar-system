// ═══════════════════════════════════════════════════════════
// ASTRAL COMMAND — Solar System Observatory Engine v2.0
// ═══════════════════════════════════════════════════════════

let scene, camera, renderer, clock;
let simTime = 0, simSpeed = 1, paused = false;
let orbitsVisible = true, labelsVisible = true, stationsVisible = true;
let trailsVisible = false, cometVisible = true, voyagersVisible = false;
let scaleMode = false, rulerMode = false, timelineMode = false;
let followTarget = null;
let planets = [], moons = [], stationObjs = [], allBodies = [];
let voyagerObjs = [];
let raycaster, mouseVec, hoveredObj = null;
let starField, sunLight, ambientLight;
let audioCtx, soundEnabled = true, soundVolume = 0.5;
let cameraSensitivity = 5;
let qualityLevel = 'med';
let visitedBodies = new Set();
let achievements = {};
let isDragging = false, prevMouse = {x:0,y:0};
let camTheta = 0.8, camPhi = 0.6, camDist = 80;
let camTarget = new THREE.Vector3(0,0,0);
let targetCamTarget = new THREE.Vector3(0,0,0);
let targetCamDist = camDist;
let labelElements = [];
let trailPoints = {};
let trailLines = {};
let cursorTrailEnabled = false;
let bookmarks = [];
let savedPositions = {};
let konamiCode = [];
const KONAMI = [38,38,40,40,37,39,37,39,66,65]; // ↑↑↓↓←→←→BA
let cosmosRevealed = false;
let rulerLine = null;

// ── BODY DATA ──
const PLANET_DATA = [
  { name:'Mercury', radius:0.38, dist:10, speed:4.15, color:0xb5b5b5, tilt:0.03, rotSpeed:0.01, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'57.9M km','Diameter':'4,879 km','Day Length':'59 Earth days','Year Length':'88 Earth days','Moons':'0','Temperature':'-180 to 430°C','Gravity':'3.7 m/s²','Atmosphere':'Virtually none'},
    desc:'The smallest planet and closest to the Sun. Its surface is covered in craters and looks similar to our Moon.',
    facts:['Mercury has no atmosphere to retain heat, causing extreme temperature swings.','A year on Mercury is just 88 Earth days.','Mercury\'s core takes up about 85% of the planet\'s radius.','Mercury has a magnetic field despite its small size.'],
    realDist:57.9, navColor:'#b5b5b5' },
  { name:'Venus', radius:0.95, dist:15, speed:1.62, color:0xe8cda0, tilt:177.4*Math.PI/180, rotSpeed:-0.005, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'108.2M km','Diameter':'12,104 km','Day Length':'243 Earth days','Year Length':'225 Earth days','Moons':'0','Temperature':'465°C average','Gravity':'8.87 m/s²','Atmosphere':'96.5% CO₂'},
    desc:'The hottest planet in our solar system due to its thick greenhouse atmosphere. It rotates backwards.',
    facts:['Venus rotates backwards — the Sun rises in the west.','A day on Venus (243 Earth days) is longer than its year (225 days).','Venus has crushing surface pressure — 90× Earth\'s.','Its surface temperature can melt lead.'],
    realDist:108.2, navColor:'#e8cda0' },
  { name:'Earth', radius:1.0, dist:20, speed:1.0, color:0x4488ff, tilt:23.4*Math.PI/180, rotSpeed:0.02, type:'Terrestrial Planet', badge:'badge-planet', hasAtmosphere:true, hasMoon:true,
    stats:{'Distance from Sun':'149.6M km','Diameter':'12,742 km','Day Length':'24 hours','Year Length':'365.25 days','Moons':'1','Temperature':'-89 to 57°C','Gravity':'9.8 m/s²','Atmosphere':'78% N₂, 21% O₂'},
    desc:'Our home — the only known planet with life. 71% of its surface is covered in water.',
    facts:['Earth is the densest planet in the solar system.','The Earth\'s rotation is gradually slowing down.','Earth\'s magnetic field extends up to 65,000 km into space.','Earth has a powerful radiation belt called the Van Allen belts.'],
    realDist:149.6, navColor:'#4488ff' },
  { name:'Mars', radius:0.53, dist:28, speed:0.53, color:0xcc5533, tilt:25.2*Math.PI/180, rotSpeed:0.019, type:'Terrestrial Planet', badge:'badge-planet',
    stats:{'Distance from Sun':'227.9M km','Diameter':'6,779 km','Day Length':'24.6 hours','Year Length':'687 Earth days','Moons':'2','Temperature':'-87 to -5°C','Gravity':'3.72 m/s²','Atmosphere':'95% CO₂'},
    desc:'The Red Planet — home to Olympus Mons and Valles Marineris.',
    facts:['Olympus Mons is 21.9 km tall — nearly 3× Mount Everest.','Mars has the largest dust storms in the solar system.','Mars\'s two moons may be captured asteroids.','The Opportunity rover ran for 15 years instead of 90 days.'],
    moonData: [
      {name:'Phobos',radius:0.08,dist:1.6,speed:5.0,color:0x998877,type:'Moon'},
      {name:'Deimos',radius:0.05,dist:2.2,speed:3.0,color:0x887766,type:'Moon'}
    ],
    realDist:227.9, navColor:'#cc5533' },
  { name:'Jupiter', radius:3.5, dist:45, speed:0.084, color:0xd4a574, tilt:3.1*Math.PI/180, rotSpeed:0.04, type:'Gas Giant', badge:'badge-planet', hasAtmosphere:true,
    stats:{'Distance from Sun':'778.5M km','Diameter':'139,820 km','Day Length':'9.93 hours','Year Length':'11.86 years','Moons':'95','Temperature':'-110°C','Gravity':'24.79 m/s²','Atmosphere':'90% H₂, 10% He'},
    desc:'The largest planet — you could fit 1,300 Earths inside it. The Great Red Spot has raged for centuries.',
    facts:['Jupiter\'s Great Red Spot could swallow Earth.','Jupiter has the shortest day of any planet — under 10 hours.','Jupiter\'s magnetic field is 20,000× stronger than Earth\'s.','Jupiter has a faint ring system discovered in 1979.'],
    moonData: [
      {name:'Io',radius:0.28,dist:6,speed:2.5,color:0xeecc33,type:'Moon'},
      {name:'Europa',radius:0.24,dist:7.5,speed:1.8,color:0xccddee,type:'Moon'},
      {name:'Ganymede',radius:0.42,dist:9,speed:1.2,color:0x998877,type:'Moon'},
      {name:'Callisto',radius:0.38,dist:11,speed:0.7,color:0x665544,type:'Moon'}
    ],
    realDist:778.5, navColor:'#d4a574' },
  { name:'Saturn', radius:3.0, dist:65, speed:0.034, color:0xead6a6, tilt:26.7*Math.PI/180, rotSpeed:0.038, type:'Gas Giant', badge:'badge-planet', hasRing:true, hasAtmosphere:true,
    stats:{'Distance from Sun':'1.43B km','Diameter':'116,460 km','Day Length':'10.7 hours','Year Length':'29.46 years','Moons':'146','Temperature':'-140°C','Gravity':'10.44 m/s²','Atmosphere':'96% H₂, 3% He'},
    desc:'Famous for its spectacular ring system. It\'s the least dense planet — it would float in water!',
    facts:['Saturn\'s rings are mostly water ice.','Saturn would float in water if a bathtub large enough existed.','Winds on Saturn can reach 1,800 km/h.','Saturn\'s moon Titan has lakes of liquid methane.'],
    moonData: [
      {name:'Titan',radius:0.4,dist:7,speed:0.8,color:0xcc9944,type:'Moon'},
      {name:'Enceladus',radius:0.12,dist:5,speed:1.5,color:0xeeeeff,type:'Moon'},
      {name:'Mimas',radius:0.08,dist:4,speed:2.0,color:0xbbbbcc,type:'Moon'}
    ],
    realDist:1430, navColor:'#ead6a6' },
  { name:'Uranus', radius:2.0, dist:82, speed:0.012, color:0x88ccdd, tilt:97.8*Math.PI/180, rotSpeed:-0.03, type:'Ice Giant', badge:'badge-planet', hasRing:true,
    stats:{'Distance from Sun':'2.87B km','Diameter':'50,724 km','Day Length':'17.2 hours','Year Length':'84 years','Moons':'27','Temperature':'-195°C','Gravity':'8.87 m/s²','Atmosphere':'83% H₂, 15% He'},
    desc:'The sideways planet — it rotates on its side with an axial tilt of 98°.',
    facts:['Uranus rotates on its side, likely from an ancient collision.','Uranus has 13 known rings.','Uranus\'s seasons each last about 21 Earth years.','Uranus was the first planet discovered with a telescope.'],
    moonData: [
      {name:'Miranda',radius:0.1,dist:3.5,speed:2.0,color:0xaabbcc,type:'Moon'},
      {name:'Ariel',radius:0.14,dist:4.5,speed:1.5,color:0xbbccdd,type:'Moon'}
    ],
    realDist:2870, navColor:'#88ccdd' },
  { name:'Neptune', radius:1.9, dist:100, speed:0.006, color:0x3355cc, tilt:28.3*Math.PI/180, rotSpeed:0.032, type:'Ice Giant', badge:'badge-planet', hasAtmosphere:true,
    stats:{'Distance from Sun':'4.5B km','Diameter':'49,244 km','Day Length':'16.1 hours','Year Length':'164.8 years','Moons':'16','Temperature':'-200°C','Gravity':'11.15 m/s²','Atmosphere':'80% H₂, 19% He'},
    desc:'The windiest planet with speeds up to 2,100 km/h. Deep blue from methane.',
    facts:['Neptune has the strongest winds of any planet — up to 2,100 km/h.','Neptune was the first planet found by mathematical prediction.','Neptune\'s moon Triton orbits backwards.','Its Great Dark Spot was first seen by Voyager 2 in 1989.'],
    moonData: [
      {name:'Triton',radius:0.22,dist:4,speed:1.5,color:0x99aabb,type:'Moon'}
    ],
    realDist:4500, navColor:'#3355cc' }
];

const SUN_DATA = {
  name:'The Sun', radius:5, type:'G-type Main Sequence Star', badge:'badge-star',
  stats:{'Diameter':'1.39M km','Surface Temp':'5,500°C','Core Temp':'15M °C','Age':'4.6B years','Mass':'333,000× Earth','Composition':'73% H, 25% He','Luminosity':'3.8×10²⁶ W','Rotation':'25-35 days'},
  desc:'Our star — a massive ball of hydrogen and helium plasma containing 99.86% of the solar system\'s mass.',
  facts:['The Sun loses 4 million tonnes of mass every second through fusion.','Light from the Sun takes 8 min 20 sec to reach Earth.','The Sun\'s core temperature is about 15 million °C.','The Sun will become a red giant in about 5 billion years.'],
  realDist:0, navColor:'#FFB800'
};

const DWARF_DATA = [
  { name:'Ceres', radius:0.25, dist:35, speed:0.35, color:0x778899, tilt:0.03, rotSpeed:0.01, type:'Dwarf Planet', badge:'badge-dwarf',
    stats:{'Distance from Sun':'413.7M km','Diameter':'939 km','Day Length':'9.1 hours','Year Length':'4.6 years','Moons':'0','Temperature':'-106°C','Gravity':'0.28 m/s²','Atmosphere':'Transient water vapor'},
    desc:'The largest object in the asteroid belt and the only dwarf planet in the inner solar system.',
    facts:['Ceres contains about a third of the asteroid belt\'s total mass.','NASA\'s Dawn found organic molecules on Ceres.','Ceres may have a subsurface ocean of liquid water.','Ceres was classified as a planet when discovered in 1801.'],
    realDist:413.7, navColor:'#778899' },
  { name:'Pluto', radius:0.25, dist:115, speed:0.004, color:0xccbbaa, tilt:122.5*Math.PI/180, rotSpeed:-0.01, type:'Dwarf Planet', badge:'badge-dwarf',
    stats:{'Distance from Sun':'5.9B km','Diameter':'2,377 km','Day Length':'6.4 Earth days','Year Length':'248 years','Moons':'5','Temperature':'-230°C','Gravity':'0.62 m/s²','Atmosphere':'Thin N₂'},
    desc:'Once the 9th planet, now a dwarf planet since 2006. Has a heart-shaped nitrogen ice plain called Tombaugh Regio.',
    facts:['Pluto\'s heart-shaped region is called Tombaugh Regio.','Pluto is smaller than Earth\'s Moon.','New Horizons revealed Pluto has blue skies and water ice.','Pluto and Charon are tidally locked to each other.'],
    moonData: [
      {name:'Charon',radius:0.12,dist:2.5,speed:1.0,color:0x998877,type:'Moon'}
    ],
    realDist:5900, navColor:'#ccbbaa' }
];

const COMET_DATA = {
  name:'Halley', radius:0.15, type:'Periodic Comet', badge:'badge-comet',
  perihelion:15, aphelion:90, speed:0.15, eccentricity:0.967,
  stats:{'Orbital Period':'75-79 years','Last Perihelion':'1986','Next Perihelion':'2061','Nucleus':'15×8 km','Tail Length':'Up to 100M km','Composition':'Ice, dust, CO₂','Discovery':'Edmond Halley, 1705','First Observed':'240 BC'},
  desc:'The most famous periodic comet, visible from Earth every 75-79 years.',
  facts:['Halley\'s Comet has been observed for over 2,200 years.','Mark Twain was born and died in Halley\'s Comet years.','The comet will next be visible in mid-2061.','The Giotto probe flew within 596 km of its nucleus in 1986.'],
  realDist:999, navColor:'#aaddff'
};

const VOYAGER_DATA = [
  { name:'Voyager 1', radius:0.08, type:'Space Probe', badge:'badge-probe', color:0xffcc44,
    stats:{'Launched':'Sept 5, 1977','Distance':'24.5B km (2024)','Speed':'17 km/s','Mission':'Outer planets & beyond','Status':'Interstellar space','Power':'RTG (decaying)','Signal':'~22.5 light-hours','Golden Record':'Yes'},
    desc:'The most distant human-made object. Launched in 1977, it flew past Jupiter and Saturn before entering interstellar space in 2012.',
    facts:['Voyager 1 entered interstellar space on August 25, 2012.','It carries a Golden Record with sounds and images of Earth.','Its signal takes over 22 hours to reach Earth.','It will pass within 1.6 light-years of Gliese 445 in ~40,000 years.'],
    realDist:24500, navColor:'#ffcc44', orbitRadius:160, speed:0.0025, startAngle:0.4 },
  { name:'Voyager 2', radius:0.08, type:'Space Probe', badge:'badge-probe', color:0xffaa22,
    stats:{'Launched':'Aug 20, 1977','Distance':'20.5B km (2024)','Speed':'15 km/s','Mission':'Grand Tour','Status':'Interstellar space','Power':'RTG (decaying)','Signal':'~18.5 light-hours','Golden Record':'Yes'},
    desc:'The only probe to have visited all four outer planets. It entered interstellar space in 2018.',
    facts:['Voyager 2 is the only spacecraft to visit Uranus and Neptune.','It entered interstellar space on November 5, 2018.','Both Voyagers have enough power until about 2025.','It discovered Jupiter\'s volcanic activity on Io.'],
    realDist:20500, navColor:'#ffaa22', orbitRadius:150, speed:0.002, startAngle:2.1 }
];

const STATION_DATA = [
  { name:'ISS', orbitPlanet:'Earth', dist:3.2, speed:8.0, size:0.25, color:0xcccccc,
    type:'Space Station', badge:'badge-station',
    stats:{'Altitude':'408 km','Speed':'27,600 km/h','Orbit Period':'92 min','Crew':'6-7','Length':'109 m','Mass':'420,000 kg','Solar Panels':'8','First Module':'1998'},
    desc:'The International Space Station — humanity\'s outpost in orbit since 2000.',
    facts:['The ISS orbits Earth every 92 minutes.','It has been continuously inhabited since November 2000.','The ISS is the most expensive single object ever constructed.','It can be seen with the naked eye from Earth.'],
    navColor:'#cccccc' },
  { name:'Tiangong', orbitPlanet:'Earth', dist:3.8, speed:6.5, size:0.18, color:0xffd700,
    type:'Space Station', badge:'badge-station',
    stats:{'Altitude':'340-450 km','Speed':'27,600 km/h','Orbit Period':'91 min','Crew':'3-6','Length':'55 m','Mass':'100,000 kg','Country':'China','Launched':'2021'},
    desc:'China\'s space station — "Heavenly Palace".',
    facts:['Tiangong means "Heavenly Palace" in Chinese.','It was built independently by China.','It orbits at a similar altitude to the ISS.','It has conducted over 100 experiments.'],
    navColor:'#FFB800' },
  { name:'Hubble', orbitPlanet:'Earth', dist:3.5, speed:7.0, size:0.12, color:0x8888ff,
    type:'Space Telescope', badge:'badge-station',
    stats:{'Altitude':'547 km','Speed':'27,400 km/h','Orbit Period':'95 min','Mirror':'2.4 m','Launched':'1990','Weight':'11,110 kg','Pictures Taken':'1.5M+','Decommission':'~2030'},
    desc:'One of humanity\'s greatest scientific instruments.',
    facts:['Hubble has captured over 1.5 million observations.','It was repaired by astronauts 5 times.','The Hubble Deep Field revealed 3,000+ galaxies in a tiny patch.','It orbits Earth about 15 times per day.'],
    navColor:'#8888ff' },
  { name:'James Webb', orbitPlanet:null, lagrangeL2:true, dist:0, speed:0, size:0.15, color:0xff6644,
    type:'Space Telescope', badge:'badge-station',
    stats:{'Location':'L2 Lagrange Point','Distance':'1.5M km','Mirror':'6.5 m','Launched':'2021','Cost':'$10B','Wavelength':'Infrared','Shield Size':'22×12 m','Orbit':'Halo orbit L2'},
    desc:'The most powerful space telescope ever built, orbiting L2 and looking back to the dawn of the universe.',
    facts:['JWST\'s mirror is 6× larger than Hubble\'s.','It can detect heat from a bumblebee at Moon distance.','Its sunshield is the size of a tennis court.','It was in development for over 25 years.'],
    navColor:'#ff6644' },
  { name:'Gateway', orbitPlanet:'Moon', parentMoon:'Luna', dist:2.0, speed:3.0, size:0.2, color:0x44aaff,
    type:'Planned Station', badge:'badge-station',
    stats:{'Location':'Lunar orbit','Altitude':'~3,000 km','Purpose':'Artemis base','Status':'Planning phase','Modules':'4+','Crew':'4','Planned':'~2028','Partners':'NASA, ESA, JAXA, CSA'},
    desc:'The planned lunar orbit station — staging point for Artemis missions.',
    facts:['Gateway will orbit the Moon in a near-rectilinear halo orbit.','It will serve as a staging point for lunar surface missions.','The first module (PPE) is planned for launch in 2025.','Canada is building the external robotics.'],
    navColor:'#44aaff' }
];

const TOURS = [
  { name:'Solar Tour', steps:[
    {body:'The Sun',text:'Welcome to ASTRAL COMMAND. Our star contains 99.86% of the solar system\'s mass.'},
    {body:'Mercury',text:'Mercury — closest to the Sun, with extreme temperature swings from -180 to 430°C.'},
    {body:'Venus',text:'Venus — the hottest planet, shrouded in thick CO₂ clouds at 465°C.'},
    {body:'Earth',text:'Earth — our pale blue dot, the only known world with life.'},
    {body:'Mars',text:'Mars — the Red Planet, target of human exploration.'},
    {body:'Jupiter',text:'Jupiter — the gas giant king with its Great Red Spot storm.'},
    {body:'Saturn',text:'Saturn — jewel of the solar system with its spectacular rings.'},
    {body:'Uranus',text:'Uranus — the sideways planet, tilted 98° on its axis.'},
    {body:'Neptune',text:'Neptune — the windiest world at the edge of the planets.'},
    {body:'Pluto',text:'Pluto — the dwarf planet at the frontier, once the 9th planet.'}
  ]},
  { name:'Inner Planets', steps:[
    {body:'Mercury',text:'The innermost world — cratered and airless.'},
    {body:'Venus',text:'Earth\'s evil twin — 465°C beneath crushing clouds.'},
    {body:'Earth',text:'Our home — blue oceans, green lands, white clouds.'},
    {body:'Mars',text:'The Red Planet — Olympus Mons and Valles Marineris.'}
  ]},
  { name:'Outer Planets', steps:[
    {body:'Jupiter',text:'The king — 1,300 Earths could fit inside.'},
    {body:'Saturn',text:'The ringed jewel — least dense planet in the system.'},
    {body:'Uranus',text:'The sideways ice giant with 98° axial tilt.'},
    {body:'Neptune',text:'The windiest world — 2,100 km/h storms.'}
  ]},
  { name:'Stations Tour', steps:[
    {body:'ISS',text:'The International Space Station — humanity\'s outpost since 2000.'},
    {body:'Tiangong',text:'China\'s Tiangong — the Heavenly Palace.'},
    {body:'Hubble',text:'Hubble — the telescope that changed everything.'},
    {body:'James Webb',text:'James Webb — looking back to the dawn of time.'},
    {body:'Gateway',text:'Gateway — our future stepping stone to the Moon.'}
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
  'system-complete': {icon:'🏆',title:'SYSTEM COMPLETE',desc:'Visited every body in the system'},
  'cosmos-secret':   {icon:'✨',title:'COSMOS UNLOCKED',desc:'Discovered the secret konami code'},
  'voyager':         {icon:'🚀',title:'VOYAGER',desc:'Found the Voyager probes'},
  'ruler-master':    {icon:'📏',title:'RULER MASTER',desc:'Measured a distance between two bodies'}
};

// ── AUDIO ──
function initAudio() { try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {} }
function playClick() {
  if (!audioCtx || !soundEnabled) return;
  try { const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination); o.type='sine';o.frequency.value=800+Math.random()*400; g.gain.value=0.04*soundVolume; o.start();o.stop(audioCtx.currentTime+0.05); } catch(e){}
}
function playWhoosh() {
  if (!audioCtx || !soundEnabled) return;
  try { const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination); o.type='sine';o.frequency.value=200; o.frequency.exponentialRampToValueAtTime(1200,audioCtx.currentTime+0.15); g.gain.value=0.06*soundVolume; g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.3); o.start();o.stop(audioCtx.currentTime+0.3); } catch(e){}
}
function playAchievement() {
  if (!audioCtx || !soundEnabled) return;
  try { [523.25,659.25,783.99].forEach((f,i)=>{ const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination); o.type='sine';o.frequency.value=f; g.gain.value=0.08*soundVolume; g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+i*0.15+0.4); o.start(audioCtx.currentTime+i*0.15);o.stop(audioCtx.currentTime+i*0.15+0.4); }); } catch(e){}
}
function playConjunction() {
  if (!audioCtx || !soundEnabled) return;
  try { [440,554.37,659.25].forEach((f,i)=>{ const o=audioCtx.createOscillator(),g=audioCtx.createGain(); o.connect(g);g.connect(audioCtx.destination); o.type='triangle';o.frequency.value=f; g.gain.value=0.1*soundVolume; g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+i*0.2+0.8); o.start(audioCtx.currentTime+i*0.2);o.stop(audioCtx.currentTime+i*0.2+0.8); }); } catch(e){}
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
  updateLoadBar(10);
  sunLight = new THREE.PointLight(0xffeedd, 2, 500);
  sunLight.castShadow = true; scene.add(sunLight);
  ambientLight = new THREE.AmbientLight(0x111122, 0.3); scene.add(ambientLight);

  createStarfield(); updateLoadBar(25);
  createSun(); updateLoadBar(35);
  createPlanets(); updateLoadBar(50);
  createDwarfPlanets();
  createComet(); updateLoadBar(60);
  createAsteroidBelt();
  createKuiperBelt();
  createSpaceStations();
  createVoyagers(); updateLoadBar(75);
  setupControls(); setupEvents(); setupSearch(); setupComparison(); setupRuler(); setupBookmarks();
  createLabels(); updateLoadBar(85);
  createAmbientDust();
  initAudio(); updateExploreBar(); updateSpeedDisplay();

  // Check for conjunctions periodically
  setInterval(checkConjunctions, 5000);

  setTimeout(() => { const l=document.getElementById('loading'); l.classList.add('fade-out'); setTimeout(()=>l.style.display='none',800); }, 500);
  animate();
}

function updateLoadBar(pct) { const b=document.getElementById('load-bar'); if(b)b.style.width=pct+'%'; }

// ── STARFIELD ──
function createStarfield() {
  const counts={low:4000,med:10000,high:18000};
  const count=counts[qualityLevel]||10000;
  const geo=new THREE.BufferGeometry();
  const pos=new Float32Array(count*3), colors=new Float32Array(count*3), twinklePhase=new Float32Array(count);
  for(let i=0;i<count;i++){
    const r=400+Math.random()*600, theta=Math.random()*Math.PI*2, phi=Math.acos(2*Math.random()-1);
    pos[i*3]=r*Math.sin(phi)*Math.cos(theta); pos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); pos[i*3+2]=r*Math.cos(phi);
    const temp=Math.random();
    if(temp>0.9){colors[i*3]=1;colors[i*3+1]=0.8;colors[i*3+2]=0.6;}
    else if(temp>0.7){colors[i*3]=0.7;colors[i*3+1]=0.8;colors[i*3+2]=1;}
    else{colors[i*3]=0.9;colors[i*3+1]=0.9;colors[i*3+2]=1;}
    twinklePhase[i]=Math.random()*Math.PI*2;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.BufferAttribute(colors,3));
  starField=new THREE.Points(geo,new THREE.PointsMaterial({size:0.8,vertexColors:true,transparent:true,opacity:0.9,sizeAttenuation:true}));
  starField.userData.twinklePhase=twinklePhase;
  scene.add(starField);
}

// ── AMBIENT DUST ──
function createAmbientDust() {
  const geo=new THREE.BufferGeometry();
  const count=500, pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){
    pos[i*3]=(Math.random()-0.5)*200;
    pos[i*3+1]=(Math.random()-0.5)*50;
    pos[i*3+2]=(Math.random()-0.5)*200;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const dust=new THREE.Points(geo,new THREE.PointsMaterial({color:0x00997F,size:0.05,transparent:true,opacity:0.3}));
  scene.add(dust);
}

// ── SUN ──
function createSun() {
  const geo=new THREE.SphereGeometry(SUN_DATA.radius,64,64);
  const mat=new THREE.MeshBasicMaterial({color:0xffcc44});
  const sun=new THREE.Mesh(geo,mat);
  sun.userData={...SUN_DATA,bodyType:'star'}; scene.add(sun); allBodies.push(sun);
  for(let i=1;i<=5;i++){ const g=new THREE.SphereGeometry(SUN_DATA.radius+i*0.7,32,32); scene.add(new THREE.Mesh(g,new THREE.MeshBasicMaterial({color:i<3?0xff8800:0xff4400,transparent:true,opacity:0.06/i,side:THREE.BackSide}))); }
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(SUN_DATA.radius+4,32,32),new THREE.MeshBasicMaterial({color:0xff6600,transparent:true,opacity:0.02,side:THREE.BackSide})));
  const flareGeo=new THREE.BufferGeometry(), flareCount=qualityLevel==='low'?200:500, flarePos=new Float32Array(flareCount*3);
  for(let i=0;i<flareCount;i++){ const r=SUN_DATA.radius+0.5+Math.random()*5,theta=Math.random()*Math.PI*2,phi=Math.acos(2*Math.random()-1); flarePos[i*3]=r*Math.sin(phi)*Math.cos(theta); flarePos[i*3+1]=r*Math.sin(phi)*Math.sin(theta); flarePos[i*3+2]=r*Math.cos(phi); }
  flareGeo.setAttribute('position',new THREE.BufferAttribute(flarePos,3));
  scene.add(new THREE.Points(flareGeo,new THREE.PointsMaterial({color:0xffaa44,size:0.3,transparent:true,opacity:0.4})));
}

// ── PLANETS ──
function createPlanets() { PLANET_DATA.forEach(data=>{ const planet=createPlanet(data); planets.push(planet); allBodies.push(planet.mesh); if(data.name==='Earth') planet.moons=[createMoon({name:'Luna',radius:0.27,dist:2.5,speed:3.0,color:0xcccccc},planet)]; if(data.moonData) planet.moons=(planet.moons||[]).concat(data.moonData.map(md=>createMoon(md,planet))); }); }

function createPlanet(data) {
  const group=new THREE.Group();
  const geo=new THREE.SphereGeometry(data.radius,48,48);
  const mat=new THREE.MeshStandardMaterial({color:data.color,roughness:0.7,metalness:0.1});
  const mesh=new THREE.Mesh(geo,mat); mesh.castShadow=true; mesh.receiveShadow=true;
  mesh.userData={...data,bodyType:data.badge==='badge-dwarf'?'dwarf':'planet'};
  group.add(mesh);
  if(data.name==='Mercury') applyMercuryTex(mat);
  if(data.name==='Venus') applyVenusTex(mat);
  if(data.name==='Earth') applyEarthTex(mat,group,data);
  if(data.name==='Mars') applyMarsTex(mat);
  if(data.name==='Jupiter') applyJupiterTex(mat);
  if(data.name==='Saturn') applySaturnTex(mat);
  if(data.name==='Uranus') applyUranusTex(mat);
  if(data.name==='Neptune') applyNeptuneTex(mat);
  if(data.name==='Ceres') { const c=document.createElement('canvas');c.width=128;c.height=64;const x=c.getContext('2d');x.fillStyle='#778899';x.fillRect(0,0,128,64);for(let i=0;i<10;i++){x.fillStyle='rgba(100,110,120,0.4)';x.beginPath();x.arc(Math.random()*128,Math.random()*64,3+Math.random()*8,0,Math.PI*2);x.fill();} mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true; }
  if(data.name==='Pluto') { const c=document.createElement('canvas');c.width=256;c.height=128;const x=c.getContext('2d');x.fillStyle='#ccbbaa';x.fillRect(0,0,256,128);x.fillStyle='#ddccbb';x.beginPath();x.ellipse(128,64,40,35,0,0,Math.PI*2);x.fill(); mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true; }
  if(data.hasAtmosphere){ const aGeo=new THREE.SphereGeometry(data.radius*1.03,48,48); const aMat=new THREE.MeshBasicMaterial({color:data.name==='Earth'?0x88bbff:data.name==='Venus'?0xddcc88:data.name==='Jupiter'?0xddbb88:data.name==='Saturn'?0xddccaa:0x4466cc,transparent:true,opacity:0.12,side:THREE.BackSide}); group.add(new THREE.Mesh(aGeo,aMat)); }
  if(data.name==='Saturn'){ group.add(createRing(data.radius*1.4,data.radius*1.9,0xd4b896,0.5)); group.add(createRing(data.radius*2.0,data.radius*2.8,0xc4a886,0.3)); }
  if(data.name==='Uranus'){ const r=createRing(data.radius*1.3,data.radius*2.0,0x88aacc,0.2); r.rotation.x=Math.PI/2-0.2; group.add(r); }
  // Orbit line
  const orbitGeo=new THREE.BufferGeometry(), orbitPoints=[];
  for(let i=0;i<=128;i++){ const angle=(i/128)*Math.PI*2; orbitPoints.push(new THREE.Vector3(Math.cos(angle)*data.dist,0,Math.sin(angle)*data.dist)); }
  orbitGeo.setFromPoints(orbitPoints);
  const orbitLine=new THREE.Line(orbitGeo,new THREE.LineBasicMaterial({color:0x00997F,transparent:true,opacity:0.2}));
  scene.add(orbitLine);
  mesh.rotation.z=data.tilt||0;

  // Initialize trail
  const trailKey = data.name;
  trailPoints[trailKey] = [];
  const trailGeo2 = new THREE.BufferGeometry();
  const trailMat2 = new THREE.LineBasicMaterial({color:data.color,transparent:true,opacity:0.4});
  const trailLine2 = new THREE.Line(trailGeo2, trailMat2);
  trailLine2.visible = false;
  scene.add(trailLine2);
  trailLines[trailKey] = trailLine2;

  const planetObj={mesh,group,data,orbitLine,moons:[],angle:Math.random()*Math.PI*2,
    update(dt){
      if(!paused) this.angle+=data.speed*dt*0.1*simSpeed;
      this.group.position.x=Math.cos(this.angle)*data.dist;
      this.group.position.z=Math.sin(this.angle)*data.dist;
      if(!paused) mesh.rotation.y+=data.rotSpeed*dt*simSpeed;
      this.moons.forEach(m=>m.update(dt));
      // Trail
      if(trailsVisible && !paused) {
        trailPoints[trailKey].push({x:this.group.position.x,y:this.group.position.z});
        if(trailPoints[trailKey].length>500) trailPoints[trailKey].shift();
        const pts=trailPoints[trailKey].map(p=>new THREE.Vector3(p.x,0,p.z));
        trailLines[trailKey].geometry.dispose();
        trailLines[trailKey].geometry=new THREE.BufferGeometry().setFromPoints(pts.length?pts:[new THREE.Vector3()]);
      }
    }
  };
  scene.add(group); return planetObj;
}

function createRing(inner,outer,color,opacity) { return new THREE.Mesh(new THREE.RingGeometry(inner,outer,64),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide})); }

// ── Procedural Textures ──
function applyMercuryTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#b0b0b0';x.fillRect(0,0,512,256);for(let i=0;i<30;i++){x.fillStyle=`rgba(80,80,80,${0.2+Math.random()*0.3})`;x.beginPath();x.arc(Math.random()*512,Math.random()*256,3+Math.random()*15,0,Math.PI*2);x.fill();}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyVenusTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');for(let y=0;y<256;y++){x.fillStyle=`hsl(40,${30+Math.sin(y*0.1)*10}%,${70+Math.sin(y*0.05)*10}%)`;x.fillRect(0,y,512,1);}for(let i=0;i<15;i++){x.fillStyle='rgba(255,255,230,0.15)';x.beginPath();x.ellipse(Math.random()*512,Math.random()*256,30+Math.random()*50,5+Math.random()*10,0,0,Math.PI*2);x.fill();}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyEarthTex(mat,group,data){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#2266aa';x.fillRect(0,0,512,256);x.fillStyle='#44aa44';[[120,60,80,50],[280,50,60,40],[320,80,40,60],[200,120,50,40],[80,100,40,50],[350,40,80,30],[150,160,30,40]].forEach(([cx,cy,w,h])=>{x.beginPath();x.ellipse(cx+w/2,cy+h/2,w/2,h/2,0,0,Math.PI*2);x.fill();});x.fillStyle='#ddeeff';x.fillRect(0,0,512,15);x.fillRect(0,241,512,15);x.fillStyle='rgba(255,255,255,0.2)';for(let i=0;i<20;i++){x.beginPath();x.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,5+Math.random()*10,0,0,Math.PI*2);x.fill();}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyMarsTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');x.fillStyle='#cc5533';x.fillRect(0,0,512,256);x.fillStyle='#eeddcc';x.fillRect(0,0,512,20);x.fillRect(0,236,512,20);x.fillStyle='#993322';for(let i=0;i<8;i++){x.beginPath();x.ellipse(Math.random()*512,Math.random()*256,20+Math.random()*40,10+Math.random()*20,0,0,Math.PI*2);x.fill();}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyJupiterTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');for(let y=0;y<256;y++){const band=Math.sin(y*0.1)*0.5+Math.sin(y*0.05+1)*0.3;x.fillStyle=`rgb(${Math.floor(180+band*50)},${Math.floor(140+band*40)},${Math.floor(100+band*30)})`;x.fillRect(0,y,512,1);}x.fillStyle='#cc5533';x.beginPath();x.ellipse(200,150,30,15,0,0,Math.PI*2);x.fill();mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applySaturnTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');for(let y=0;y<256;y++){const band=Math.sin(y*0.08)*0.4+Math.sin(y*0.03)*0.2;x.fillStyle=`rgb(${Math.floor(210+band*30)},${Math.floor(190+band*25)},${Math.floor(150+band*20)})`;x.fillRect(0,y,512,1);}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyUranusTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');for(let y=0;y<256;y++){const band=Math.sin(y*0.06)*0.2;x.fillStyle=`rgb(${Math.floor(120+band*15)},${Math.floor(190+band*10)},${Math.floor(205+band*10)})`;x.fillRect(0,y,512,1);}mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}
function applyNeptuneTex(mat){const c=document.createElement('canvas');c.width=512;c.height=256;const x=c.getContext('2d');for(let y=0;y<256;y++){const band=Math.sin(y*0.07)*0.3;x.fillStyle=`rgb(${Math.floor(40+band*15)},${Math.floor(70+band*15)},${Math.floor(190+band*20)})`;x.fillRect(0,y,512,1);}x.fillStyle='rgba(20,40,120,0.4)';x.beginPath();x.ellipse(180,120,25,12,0,0,Math.PI*2);x.fill();mat.map=new THREE.CanvasTexture(c);mat.needsUpdate=true;}

// ── DWARF PLANETS ──
function createDwarfPlanets() { DWARF_DATA.forEach(data=>{ const d=createPlanet({...data,hasAtmosphere:false,hasRing:false}); d.mesh.userData={...data,bodyType:'dwarf'}; planets.push(d); }); }

// ── MOONS ──
function createMoon(data,parent){
  const geo=new THREE.SphereGeometry(data.radius,24,24);
  const mat=new THREE.MeshStandardMaterial({color:data.color,roughness:0.8});
  const mesh=new THREE.Mesh(geo,mat); mesh.castShadow=true;
  const moonInfo={name:data.name,type:data.type||'Moon',badge:data.type==='Moon'?'badge-moon':'badge-moon',bodyType:'moon',stats:{'Parent':parent.data.name,'Radius':data.radius.toFixed(2)+' (relative)','Orbit Speed':data.speed.toFixed(1)+' (relative)'},desc:`A moon orbiting ${parent.data.name}.`,facts:[`${data.name} orbits ${parent.data.name}.`] };
  mesh.userData=moonInfo; allBodies.push(mesh); parent.group.add(mesh); moons.push(mesh);
  return {mesh,angle:Math.random()*Math.PI*2, update(dt){ if(!paused)this.angle+=data.speed*dt*0.1*simSpeed; this.mesh.position.x=Math.cos(this.angle)*data.dist; this.mesh.position.z=Math.sin(this.angle)*data.dist; }};
}

// ── COMET ──
let cometObj=null;
function createComet(){
  const group=new THREE.Group();
  const mesh=new THREE.Mesh(new THREE.SphereGeometry(COMET_DATA.radius,16,16),new THREE.MeshBasicMaterial({color:0xaaddff}));
  mesh.userData={...COMET_DATA,bodyType:'comet'}; group.add(mesh);
  const tailCount=qualityLevel==='low'?100:300, tailGeo=new THREE.BufferGeometry(), tailPos=new Float32Array(tailCount*3);
  for(let i=0;i<tailCount;i++){tailPos[i*3]=-Math.random()*8;tailPos[i*3+1]=(Math.random()-0.5)*0.5;tailPos[i*3+2]=(Math.random()-0.5)*0.5;}
  tailGeo.setAttribute('position',new THREE.BufferAttribute(tailPos,3));
  const tail=new THREE.Points(tailGeo,new THREE.PointsMaterial({color:0x88ccff,size:0.15,transparent:true,opacity:0.5}));
  group.add(tail); allBodies.push(mesh);
  cometObj={mesh,group,tail,angle:0, update(dt){
    if(!paused)this.angle+=COMET_DATA.speed*dt*0.1*simSpeed;
    const e=COMET_DATA.eccentricity, r=COMET_DATA.perihelion*(1+e)/(1+e*Math.cos(this.angle));
    this.group.position.x=Math.cos(this.angle)*r; this.group.position.z=Math.sin(this.angle)*r;
    const toSun=new THREE.Vector3(-this.group.position.x,0,-this.group.position.z).normalize();
    this.tail.rotation.y=Math.atan2(toSun.x,toSun.z);
    this.group.visible=cometVisible;
  }};
  scene.add(group);
}

// ── VOYAGERS ──
function createVoyagers(){
  VOYAGER_DATA.forEach(data=>{
    const group=new THREE.Group();
    const body=new THREE.Mesh(new THREE.BoxGeometry(data.radius,data.radius*0.3,data.radius*0.3),new THREE.MeshStandardMaterial({color:data.color,metalness:0.7,roughness:0.2}));
    group.add(body);
    const dish=new THREE.Mesh(new THREE.ConeGeometry(data.radius*0.4,data.radius*0.2,8),new THREE.MeshStandardMaterial({color:0xcccccc,metalness:0.5}));
    dish.rotation.x=Math.PI/2; dish.position.z=data.radius*0.3; group.add(dish);
    // Antenna boom
    const boom=new THREE.Mesh(new THREE.CylinderGeometry(data.radius*0.02,data.radius*0.02,data.radius*2,4),new THREE.MeshBasicMaterial({color:0x888888}));
    boom.rotation.z=Math.PI/2; group.add(boom);
    const rtg=new THREE.Mesh(new THREE.BoxGeometry(data.radius*0.15,data.radius*0.15,data.radius*0.15),new THREE.MeshBasicMaterial({color:0x444444}));
    rtg.position.x=-data.radius*1; group.add(rtg);
    group.userData={...data,bodyType:'probe'};
    allBodies.push(group); // push group for raycasting
    const voyagerObj={mesh:group,data,angle:data.startAngle,visible:false,
      update(dt){
        if(!paused) this.angle+=data.speed*dt*simSpeed;
        this.group.position.x=Math.cos(this.angle)*data.orbitRadius;
        this.group.position.z=Math.sin(this.angle)*data.orbitRadius;
        this.group.position.y=Math.sin(this.angle*0.3)*5;
        this.group.visible=this.visible;
      }
    };
    scene.add(group);
    voyagerObjs.push(voyagerObj);
  });
}

// ── ASTEROID BELT ──
let asteroids=[];
function createAsteroidBelt(){
  const count=qualityLevel==='low'?800:2000, geo=new THREE.BufferGeometry(), pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, d=34+Math.random()*8+Math.sin(a*3)*1; pos[i*3]=Math.cos(a)*d; pos[i*3+1]=(Math.random()-0.5)*1.5; pos[i*3+2]=Math.sin(a)*d; }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const belt=new THREE.Points(geo,new THREE.PointsMaterial({color:0x887766,size:0.12,transparent:true,opacity:0.5})); scene.add(belt); asteroids.push(belt);
}
function createKuiperBelt(){
  const count=qualityLevel==='low'?800:2000, geo=new THREE.BufferGeometry(), pos=new Float32Array(count*3);
  for(let i=0;i<count;i++){ const a=Math.random()*Math.PI*2, d=90+Math.random()*40; pos[i*3]=Math.cos(a)*d; pos[i*3+1]=(Math.random()-0.5)*4; pos[i*3+2]=Math.sin(a)*d; }
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  const belt=new THREE.Points(geo,new THREE.PointsMaterial({color:0x667788,size:0.08,transparent:true,opacity:0.35})); scene.add(belt); asteroids.push(belt);
}

// ── SPACE STATIONS ──
function createSpaceStations(){ STATION_DATA.forEach(data=>{ const s=createStation(data); stationObjs.push(s); allBodies.push(s.mesh); }); }
function createStation(data){
  const group=new THREE.Group();
  group.add(new THREE.Mesh(new THREE.BoxGeometry(data.size,data.size*0.4,data.size*0.4),new THREE.MeshStandardMaterial({color:data.color,metalness:0.8,roughness:0.2})));
  if(data.name!=='James Webb'){const pG=new THREE.BoxGeometry(data.size*1.5,data.size*0.02,data.size*0.6);const pM=new THREE.MeshStandardMaterial({color:0x2244aa,metalness:0.5,roughness:0.3});const pL=new THREE.Mesh(pG,pM);pL.position.x=data.size;group.add(pL);const pR=pL.clone();pR.position.x=-data.size;group.add(pR);}
  if(data.name==='James Webb'){const sG=new THREE.BoxGeometry(data.size*2,data.size*0.02,data.size*1.5);const sM=new THREE.Mesh(sG,new THREE.MeshStandardMaterial({color:0xdd8855,metalness:0.3,roughness:0.5}));sM.rotation.y=Math.PI/4;group.add(sM);}
  const blinkLight=new THREE.Mesh(new THREE.SphereGeometry(data.size*0.05,8,8),new THREE.MeshBasicMaterial({color:0xff0000}));
  blinkLight.position.y=data.size*0.25;group.add(blinkLight);
  group.userData={...data,bodyType:'station',blinkLight};
  let parentObj=null; if(data.orbitPlanet)parentObj=planets.find(p=>p.data.name===data.orbitPlanet);
  const stationObj={mesh:group,data,parentObj,angle:Math.random()*Math.PI*2,update(dt){
    if(!paused)this.angle+=(data.speed||0.5)*dt*0.1*simSpeed;
    if(data.lagrangeL2){const earth=planets.find(p=>p.data.name==='Earth');if(earth){this.mesh.position.x=earth.group.position.x+3;this.mesh.position.y=1;this.mesh.position.z=earth.group.position.z;}}
    else if(this.parentObj){this.mesh.position.x=this.parentObj.group.position.x+Math.cos(this.angle)*data.dist;this.mesh.position.z=this.parentObj.group.position.z+Math.sin(this.angle)*data.dist;this.mesh.position.y=Math.sin(this.angle*0.3)*0.2;}
    this.mesh.visible=stationsVisible;
    if(blinkLight&&Math.sin(simTime*3)>0.7)blinkLight.material.color.setHex(0xff0000);
    else if(blinkLight)blinkLight.material.color.setHex(0x330000);
    if(!paused)this.mesh.rotation.y+=dt*0.5*simSpeed;
  }};
  scene.add(group); return stationObj;
}

// ── LABELS ──
function createLabels(){
  const container=document.getElementById('labels-container');
  const allNames=[...PLANET_DATA.map(p=>p.name),'The Sun',...DWARF_DATA.map(d=>d.name),'Halley','Voyager 1','Voyager 2'];
  allNames.forEach(name=>{ const el=document.createElement('div'); el.className='planet-label'; el.id='label-'+name.replace(/\s/g,'-'); el.textContent=name.toUpperCase(); container.appendChild(el); labelElements.push({name,el}); });
}
function updateLabels(){
  labelElements.forEach(({name,el})=>{
    let body=allBodies.find(b=>b.userData&&b.userData.name===name);
    if(!body)return;
    let pos=new THREE.Vector3();
    if(body.userData.bodyType==='planet'||body.userData.bodyType==='dwarf'){const p=planets.find(p=>p.data.name===name);if(p)pos.copy(p.group.position);else return;}
    else if(body.userData.bodyType==='star'){pos.set(0,0,0);}
    else if(body.userData.bodyType==='probe'){const v=voyagerObjs.find(v=>v.data.name===name);if(v)pos.copy(v.mesh.position);else return;}
    else{return;}
    pos.y+=((body.userData.radius||1)*1.5+1);
    pos.project(camera);
    if(pos.z>1){el.classList.remove('show');return;}
    el.style.left=((pos.x*0.5+0.5)*window.innerWidth)+'px';
    el.style.top=((-pos.y*0.5+0.5)*window.innerHeight)+'px';
    el.classList.toggle('show',labelsVisible);
  });
}

// ── CAMERA ──
function setupControls(){
  const canvas=renderer.domElement;
  canvas.addEventListener('mousedown',e=>{isDragging=true;prevMouse={x:e.clientX,y:e.clientY};});
  canvas.addEventListener('mousemove',e=>{
    if(isDragging){const s=cameraSensitivity*0.001; camTheta-=(e.clientX-prevMouse.x)*s; camPhi=Math.max(0.1,Math.min(Math.PI-0.1,camPhi-(e.clientY-prevMouse.y)*s)); prevMouse={x:e.clientX,y:e.clientY};}
    mouseVec.x=(e.clientX/window.innerWidth)*2-1; mouseVec.y=-(e.clientY/window.innerHeight)*2+1;
    if(cursorTrailEnabled){const sp=document.createElement('div');sp.className='cursor-spark';sp.style.left=e.clientX+'px';sp.style.top=e.clientY+'px';document.body.appendChild(sp);setTimeout(()=>sp.remove(),600);}
  });
  canvas.addEventListener('mouseup',()=>isDragging=false);
  canvas.addEventListener('wheel',e=>{targetCamDist*=1+e.deltaY*0.001;targetCamDist=Math.max(5,Math.min(500,targetCamDist));});
  canvas.addEventListener('touchstart',e=>{if(e.touches.length===1){isDragging=true;prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY};}});
  canvas.addEventListener('touchmove',e=>{if(isDragging&&e.touches.length===1){const dx=e.touches[0].clientX-prevMouse.x,dy=e.touches[0].clientY-prevMouse.y;camTheta-=dx*0.005;camPhi=Math.max(0.1,Math.min(Math.PI-0.1,camPhi-dy*0.005));prevMouse={x:e.touches[0].clientX,y:e.touches[0].clientY};}});
  canvas.addEventListener('touchend',()=>isDragging=false);
  canvas.addEventListener('dblclick',()=>{raycaster.setFromCamera(mouseVec,camera);const hits=raycaster.intersectObjects(allBodies,true);if(hits.length>0){let obj=hits[0].object;while(obj.parent&&!obj.userData.name)obj=obj.parent;if(obj.userData.name)focusBody(obj);}});
}

function focusBody(obj){followTarget=obj;targetCamDist=(obj.userData.radius||2)*5+3;document.getElementById('btn-follow').classList.add('active');showInfo(obj.userData);markVisited(obj.userData.name);playWhoosh();}
function navigateToBody(name){const body=allBodies.find(b=>b.userData&&b.userData.name===name);if(body)focusBody(body);}

// ── EVENTS ──
function setupEvents(){
  window.addEventListener('resize',()=>{camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();renderer.setSize(window.innerWidth,window.innerHeight);});
  renderer.domElement.addEventListener('click',()=>{
    raycaster.setFromCamera(mouseVec,camera);
    const hits=raycaster.intersectObjects(allBodies,true);
    if(hits.length>0){let obj=hits[0].object;while(obj.parent&&!obj.userData.name)obj=obj.parent;if(obj.userData.name){showInfo(obj.userData);markVisited(obj.userData.name);playClick();}}
    else{document.getElementById('info-panel').classList.remove('visible');}
  });
  // Buttons
  document.getElementById('btn-pause').onclick=()=>{paused=!paused;document.getElementById('btn-pause').textContent=paused?'▶':'⏸';document.getElementById('btn-pause').classList.toggle('active',!paused);playClick();};
  document.getElementById('btn-slower').onclick=()=>{simSpeed=Math.max(0.1,simSpeed/2);updateSpeedDisplay();playClick();};
  document.getElementById('btn-faster').onclick=()=>{simSpeed=Math.min(50,simSpeed*2);updateSpeedDisplay();if(simSpeed>=50)unlockAchievement('speed-demon');playClick();};
  document.getElementById('btn-1x').onclick=()=>{simSpeed=1;updateSpeedDisplay();playClick();};
  document.getElementById('btn-10x').onclick=()=>{simSpeed=10;updateSpeedDisplay();playClick();};
  document.getElementById('btn-50x').onclick=()=>{simSpeed=50;updateSpeedDisplay();playClick();};
  document.getElementById('btn-max').onclick=()=>{simSpeed=50;updateSpeedDisplay();unlockAchievement('speed-demon');playClick();};
  document.getElementById('btn-orbits').onclick=()=>{orbitsVisible=!orbitsVisible;planets.forEach(p=>p.orbitLine.visible=orbitsVisible);document.getElementById('btn-orbits').classList.toggle('active',orbitsVisible);playClick();};
  document.getElementById('btn-labels').onclick=()=>{labelsVisible=!labelsVisible;document.getElementById('btn-labels').classList.toggle('active',labelsVisible);playClick();};
  document.getElementById('btn-follow').onclick=()=>{if(followTarget){followTarget=null;document.getElementById('btn-follow').classList.remove('active');}playClick();};
  document.getElementById('btn-stations').onclick=()=>{stationsVisible=!stationsVisible;document.getElementById('btn-stations').classList.toggle('active',stationsVisible);playClick();};
  document.getElementById('btn-comet').onclick=()=>{cometVisible=!cometVisible;document.getElementById('btn-comet').classList.toggle('active',cometVisible);playClick();};
  document.getElementById('btn-trails').onclick=()=>{trailsVisible=!trailsVisible;Object.values(trailLines).forEach(l=>l.visible=trailsVisible);if(!trailsVisible)Object.keys(trailPoints).forEach(k=>trailPoints[k]=[]);document.getElementById('btn-trails').classList.toggle('active',trailsVisible);playClick();};
  document.getElementById('btn-scale').onclick=()=>{scaleMode=!scaleMode;document.getElementById('btn-scale').classList.toggle('active',scaleMode);playClick();showToast(scaleMode?'⚖ Scale mode ON — planet sizes enhanced':'⚖ Scale mode OFF — realistic sizes');};
  document.getElementById('btn-ruler').onclick=()=>{rulerMode=!rulerMode;document.getElementById('ruler-panel').classList.toggle('visible',rulerMode);document.getElementById('btn-ruler').classList.toggle('active',rulerMode);if(rulerMode)unlockAchievement('ruler-master');playClick();};
  document.getElementById('btn-timeline').onclick=()=>{timelineMode=!timelineMode;document.getElementById('timeline').classList.toggle('show',timelineMode);document.getElementById('btn-timeline').classList.toggle('active',timelineMode);playClick();};
  document.getElementById('btn-bookmark').onclick=()=>{document.getElementById('bookmarks').classList.toggle('visible');playClick();};
  document.getElementById('btn-compare').onclick=()=>{document.getElementById('comparison').classList.toggle('visible');playClick();};
  document.getElementById('btn-fullscreen').onclick=()=>{if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();playClick();};
  document.getElementById('btn-screenshot').onclick=()=>{takeScreenshot();playClick();};
  document.getElementById('btn-keyboard').onclick=()=>{document.getElementById('shortcuts').classList.toggle('visible');playClick();};
  document.getElementById('btn-tour').onclick=()=>{startTour(0);playClick();};
  document.getElementById('tour-next').onclick=()=>advanceTour(1);
  document.getElementById('tour-prev').onclick=()=>advanceTour(-1);
  document.getElementById('tour-end').onclick=()=>endTour();
  document.getElementById('close-info').onclick=()=>document.getElementById('info-panel').classList.remove('visible');
  // Nav items
  document.querySelectorAll('.nav-item').forEach(item=>{item.addEventListener('click',()=>{navigateToBody(item.dataset.name);document.querySelectorAll('.nav-item').forEach(i=>i.classList.remove('active'));item.classList.add('active');playClick();});});
  // Keyboard
  document.addEventListener('keydown',e=>{
    if(e.target.tagName==='INPUT'||e.target.tagName==='SELECT')return;
    const k=e.key;
    if(k==='Escape'){followTarget=null;document.getElementById('btn-follow').classList.remove('active');document.getElementById('info-panel').classList.remove('visible');document.getElementById('shortcuts').classList.remove('visible');document.getElementById('comparison').classList.remove('visible');document.getElementById('bookmarks').classList.remove('visible');endTour();}
    if(k===' '){e.preventDefault();paused=!paused;document.getElementById('btn-pause').textContent=paused?'▶':'⏸';}
    if(k==='+'||k==='='){simSpeed=Math.min(50,simSpeed*1.5);updateSpeedDisplay();}
    if(k==='-'){simSpeed=Math.max(0.1,simSpeed/1.5);updateSpeedDisplay();}
    if(k==='1')navigateToBody('Mercury');if(k==='2')navigateToBody('Venus');if(k==='3')navigateToBody('Earth');if(k==='4')navigateToBody('Mars');if(k==='5')navigateToBody('Jupiter');if(k==='6')navigateToBody('Saturn');if(k==='7')navigateToBody('Uranus');if(k==='8')navigateToBody('Neptune');if(k==='0')navigateToBody('The Sun');if(k==='9')navigateToBody('Pluto');
    if(k==='o'||k==='O'){orbitsVisible=!orbitsVisible;planets.forEach(p=>p.orbitLine.visible=orbitsVisible);}
    if(k==='l'||k==='L'){labelsVisible=!labelsVisible;}
    if(k==='t'||k==='T'){trailsVisible=!trailsVisible;Object.values(trailLines).forEach(l=>l.visible=trailsVisible);if(!trailsVisible)Object.keys(trailPoints).forEach(k2=>trailPoints[k2]=[]);}
    if(k==='g'||k==='G'){scaleMode=!scaleMode;document.getElementById('btn-scale').classList.toggle('active',scaleMode);}
    if(k==='v'||k==='V'){voyagersVisible=!voyagersVisible;voyagerObjs.forEach(v=>v.visible=voyagersVisible);}
    if(k==='f'||k==='F'){if(!document.fullscreenElement)document.documentElement.requestFullscreen();else document.exitFullscreen();}
    if(k==='s'||k==='S')takeScreenshot();
    if(k==='c'||k==='C')document.getElementById('comparison').classList.toggle('visible');
    if(k==='d'||k==='D')startTour(0);
    if(k==='b'||k==='B')saveBookmark();
    if(k==='r'||k==='R'){rulerMode=!rulerMode;document.getElementById('ruler-panel').classList.toggle('visible',rulerMode);document.getElementById('btn-ruler').classList.toggle('active',rulerMode);}
    if(k==='?')document.getElementById('shortcuts').classList.toggle('visible');
    // Konami code
    konamiCode.push(k.charCodeAt(0));if(konamiCode.length>10)konamiCode.shift();
    if(konamiCode.join(',')===KONAMI.join(','))unlockCosmos();
  });
  // Settings
  document.getElementById('set-quality').onchange=e=>qualityLevel=e.target.value;
  document.getElementById('set-sound').oninput=e=>soundVolume=e.target.value/100;
  document.getElementById('set-sensitivity').oninput=e=>cameraSensitivity=parseInt(e.target.value);
  document.getElementById('set-trail').onchange=e=>cursorTrailEnabled=e.target.value==='on';
  // Bookmark save
  document.getElementById('bm-save').onclick=()=>{saveBookmark();playClick();};
  // Timeline scrub
  document.getElementById('timeline-scrub').oninput=e=>{
    const val=parseInt(e.target.value);
    const years=Math.floor(val/365);const days=val%365;
    document.getElementById('timeline-val').textContent=years>0?`Year ${years+1} Day ${days}`:`Day ${days}`;
    simTime=val/10;
  };
  // Minimap click
  document.getElementById('minimap').addEventListener('click',e=>{
    const rect=e.target.getBoundingClientRect();
    const cx=rect.width/2,cy=rect.height/2;
    const dx=(e.clientX-rect.left-cx),dy=(e.clientY-rect.top-cy);
    const scale=0.75;
    const worldX=dx/scale,worldZ=dy/scale;
    targetCamTarget.set(worldX,0,worldZ);
    followTarget=null;document.getElementById('btn-follow').classList.remove('active');
    playClick();
  });
}

// ── SEARCH ──
function setupSearch(){
  const input=document.getElementById('search-input'),dd=document.getElementById('search-dropdown');
  input.addEventListener('input',()=>{
    const q=input.value.toLowerCase().trim();if(!q){dd.classList.remove('show');return;}
    const matches=allBodies.filter(b=>b.userData&&b.userData.name&&b.userData.name.toLowerCase().includes(q)).slice(0,8);
    if(!matches.length){dd.classList.remove('show');return;}
    dd.innerHTML=matches.map(b=>`<div class="search-item" data-name="${b.userData.name}"><span class="nav-dot" style="background:${b.userData.navColor||'#888'};width:6px;height:6px;border-radius:50%;display:inline-block;"></span> <span>${b.userData.name}</span> <span class="si-type">${b.userData.type||''}</span></div>`).join('');
    dd.classList.add('show');
    dd.querySelectorAll('.search-item').forEach(item=>{item.addEventListener('click',()=>{navigateToBody(item.dataset.name);input.value='';dd.classList.remove('show');});});
  });
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){const q=input.value.toLowerCase().trim();const match=allBodies.find(b=>b.userData&&b.userData.name&&b.userData.name.toLowerCase().includes(q));if(match){focusBody(match);input.value='';dd.classList.remove('show');}}if(e.key==='Escape'){input.value='';dd.classList.remove('show');}});
  document.addEventListener('click',e=>{if(!e.target.closest('#search-container'))dd.classList.remove('show');});
}

// ── COMPARISON ──
function setupComparison(){
  const sA=document.getElementById('comp-a'),sB=document.getElementById('comp-b');
  const names=['The Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto','Ceres'];
  names.forEach(n=>{sA.innerHTML+=`<option value="${n}">${n}</option>`;sB.innerHTML+=`<option value="${n}">${n}</option>`;});
  sB.value='Jupiter';
  function update(){
    const a=findDataFor(sA.value),b=findDataFor(sB.value);if(!a||!b)return;
    const keys=Object.keys(a.stats).filter(k=>b.stats[k]);
    document.getElementById('comp-stats').innerHTML=keys.map(k=>`<div class="comp-row"><span class="comp-label">${k}</span><span class="comp-a">${a.stats[k]}</span><span class="comp-b">${b.stats[k]}</span></div>`).join('');
    // Size compare visual
    const aR=parseFloat(a.stats.Diameter)||1,bR=parseFloat(b.stats.Diameter)||1;
    const maxR=Math.max(aR,bR);
    const aSize=Math.max(20,Math.min(55,aR/maxR*55)),bSize=Math.max(20,Math.min(55,bR/maxR*55));
    document.getElementById('size-compare').innerHTML=`<div style="display:flex;align-items:center;justify-content:center;gap:20px;"><div class="size-circle size-a" style="width:${aSize}px;height:${aSize}px;">${a.name.substring(0,3)}</div><div class="size-circle size-b" style="width:${bSize}px;height:${bSize}px;">${b.name.substring(0,3)}</div></div>`;
  }
  sA.onchange=update;sB.onchange=update;update();
}
function findDataFor(name){return[SUN_DATA,...PLANET_DATA,...DWARF_DATA].find(d=>d.name===name);}

// ── RULER ──
function setupRuler(){
  const from=document.getElementById('ruler-from'),to=document.getElementById('ruler-to');
  const names=['The Sun','Mercury','Venus','Earth','Mars','Jupiter','Saturn','Uranus','Neptune','Pluto'];
  names.forEach(n=>{from.innerHTML+=`<option value="${n}">${n}</option>`;to.innerHTML+=`<option value="${n}">${n}</option>`;});
  to.value='Mars';
  function update(){const a=findDataFor(from.value),b=findDataFor(to.value);if(!a||!b)return;
    const dist=Math.abs((a.realDist||0)-(b.realDist||0));
    const lightMin=dist*1e6/299792.458/60;
    document.getElementById('ruler-result').innerHTML=`<div style="margin-top:8px;"><strong style="color:var(--hologram);">${dist.toFixed(1)}M km</strong><br><span style="color:var(--text-muted);font-size:0.6rem;">Light travel: ${lightMin<60?lightMin.toFixed(1)+' min':(lightMin/60).toFixed(1)+' hours'}</span></div>`;
    if(rulerMode)unlockAchievement('ruler-master');
  }
  from.onchange=update;to.onchange=update;update();
}

// ── BOOKMARKS ──
function setupBookmarks(){renderBookmarks();}
function saveBookmark(){
  const name=followTarget?followTarget.userData.name:(followTarget?'Unknown':'Free camera');
  const bm={name,pos:{x:camTarget.x,y:camTarget.y,z:camTarget.z},theta:camTheta,phi:camPhi,dist:camDist,speed:simSpeed,time:Date.now()};
  bookmarks.push(bm);renderBookmarks();showToast('🔖 Bookmark saved: '+name);playClick();
}
function renderBookmarks(){
  const list=document.getElementById('bm-list');
  list.innerHTML=bookmarks.map((bm,i)=>`<div class="bm-item" onclick="restoreBookmark(${i})"><span>${bm.name}</span><span class="bm-del" onclick="event.stopPropagation();deleteBookmark(${i})">×</span></div>`).join('');
  if(!bookmarks.length)list.innerHTML='<div style="color:var(--text-muted);font-size:0.65rem;font-family:var(--font-mono);padding:8px;">No bookmarks yet. Press B to save.</div>';
}
window.restoreBookmark=function(i){const bm=bookmarks[i];camTarget.set(bm.pos.x,bm.pos.y,bm.pos.z);camTheta=bm.theta;camPhi=bm.phi;targetCamDist=bm.dist;simSpeed=bm.speed;updateSpeedDisplay();playWhoosh();};
window.deleteBookmark=function(i){bookmarks.splice(i,1);renderBookmarks();};

// ── INFO PANEL ──
function showInfo(data){
  document.getElementById('info-name').textContent=data.name;
  const badge=document.getElementById('info-type-badge');badge.textContent=data.type||'';badge.className=data.badge||'badge-planet';
  let statsHtml='';if(data.stats)Object.entries(data.stats).forEach(([l,v])=>{statsHtml+=`<div class="stat-row"><span class="stat-label">${l}</span><span class="stat-value">${v}</span></div>`;});
  document.getElementById('info-stats').innerHTML=statsHtml;
  document.getElementById('info-desc').textContent=data.desc||'';
  if(data.facts&&data.facts.length){document.getElementById('info-fact').innerHTML=`<span class="fact-label">◈ FUN FACT</span><br>${data.facts[Math.floor(Math.random()*data.facts.length)]}`;}else{document.getElementById('info-fact').innerHTML='';}
  // Light time from Sun
  const ltEl=document.getElementById('info-light-time');
  if(data.realDist&&data.realDist>0){const mins=data.realDist*1e6/299792.458/60;ltEl.innerHTML=`◈ LIGHT TIME FROM SUN: ${mins<60?mins.toFixed(1)+' min':(mins/60).toFixed(1)+' hours'}`;ltEl.classList.add('show');}else{ltEl.classList.remove('show');}
  // Distance from camera
  const distEl=document.getElementById('info-distance');
  if(data.realDist!==undefined){
    // Show real distance info
    distEl.innerHTML=`◈ DISTANCE FROM SUN: ${data.realDist>=1000?(data.realDist/1000).toFixed(2)+'B km':data.realDist+'M km'}`;
    distEl.classList.add('show');
  } else { distEl.classList.remove('show'); }
  document.getElementById('info-panel').classList.add('visible');
}

// ── TOUR ──
function startTour(tourIdx){currentTour=TOURS[tourIdx];tourStep=0;showTourStep();document.getElementById('tour-overlay').classList.add('visible');}
function advanceTour(dir){tourStep+=dir;if(tourStep<0)tourStep=0;if(tourStep>=currentTour.steps.length){endTour();return;}showTourStep();}
function showTourStep(){const step=currentTour.steps[tourStep];document.getElementById('tour-step').textContent=`STEP ${tourStep+1} / ${currentTour.steps.length}`;document.getElementById('tour-title').textContent=step.body.toUpperCase();document.getElementById('tour-desc').textContent=step.text;navigateToBody(step.body);}
function endTour(){currentTour=null;document.getElementById('tour-overlay').classList.remove('visible');if(visitedBodies.size>5)unlockAchievement('system-complete');}

// ── EXPLORATION ──
function markVisited(name){
  if(visitedBodies.has(name))return;visitedBodies.add(name);
  const navItem=document.querySelector(`.nav-item[data-name="${name}"]`);if(navItem)navItem.classList.add('visited');
  updateExploreBar();
  if(visitedBodies.size===1)unlockAchievement('first-contact');
  const planetNames=PLANET_DATA.map(p=>p.name);if(planetNames.every(n=>visitedBodies.has(n)))unlockAchievement('cartographer');
  if(name==='Pluto')unlockAchievement('deep-space');
  const stationNames=STATION_DATA.map(s=>s.name);if(stationNames.every(n=>visitedBodies.has(n)))unlockAchievement('station-spotter');
  if((name==='Voyager 1'||name==='Voyager 2')&&!achievements['voyager'])unlockAchievement('voyager');
  const moonCount=[...visitedBodies].filter(n=>moons.some(m=>m.userData.name===n)).length;if(moonCount>=5)unlockAchievement('moon-hunter');
  const allNames=allBodies.map(b=>b.userData?.name).filter(Boolean);if(allNames.every(n=>visitedBodies.has(n)))unlockAchievement('system-complete');
}
function updateExploreBar(){
  const total=allBodies.filter(b=>b.userData&&b.userData.name).length;
  const visited=visitedBodies.size;
  const pct=total>0?(visited/total*100):0;
  document.getElementById('exp-fill').style.width=pct+'%';
  document.getElementById('exp-text').textContent=`${visited} / ${total} EXPLORED`;
}

// ── ACHIEVEMENTS ──
function unlockAchievement(id){if(achievements[id])return;achievements[id]=true;const def=ACHIEVEMENT_DEFS[id];if(!def)return;
  document.getElementById('ach-icon').textContent=def.icon;document.getElementById('ach-title').textContent=def.title;document.getElementById('ach-desc').textContent=def.desc;
  const el=document.getElementById('achievement');el.classList.add('show');playAchievement();showToast(`🏆 ${def.title} unlocked!`);
  setTimeout(()=>el.classList.remove('show'),4000);
}

// ── KONAMI CODE ──
function unlockCosmos(){
  if(cosmosRevealed)return;cosmosRevealed=true;
  unlockAchievement('cosmos-secret');
  const flash=document.getElementById('cosmos-flash');flash.classList.add('show');
  setTimeout(()=>flash.classList.remove('show'),2000);
  // Make all planets glow rainbow for a moment
  planets.forEach(p=>{
    const origColor=p.data.color;
    const colors=[0xff0000,0xff8800,0xffff00,0x00ff00,0x00ffff,0x0000ff,0xff00ff];
    let ci=0;
    const iv=setInterval(()=>{p.mesh.material.color.setHex(colors[ci%colors.length]);ci++;},150);
    setTimeout(()=>{clearInterval(iv);p.mesh.material.color.setHex(origColor);},3000);
  });
  showToast('✨ COSMOS UNLOCKED — The universe reveals its secrets!');
}

// ── CONJUNCTIONS ──
function checkConjunctions(){
  const innerPlanets=planets.filter(p=>p.data.dist<50);
  for(let i=0;i<innerPlanets.length;i++){
    for(let j=i+1;j<innerPlanets.length;j++){
      const a=innerPlanets[i],b=innerPlanets[j];
      const dx=a.group.position.x-b.group.position.x;
      const dz=a.group.position.z-b.group.position.z;
      const dist=Math.sqrt(dx*dx+dz*dz);
      if(dist<3){
        const alert=document.getElementById('phenomena-alert');
        alert.textContent=`◈ CONJUNCTION: ${a.data.name} and ${b.data.name} are in close approach!`;
        alert.classList.add('show');
        playConjunction();
        setTimeout(()=>alert.classList.remove('show'),5000);
        return;
      }
    }
  }
}

// ── TOAST ──
function showToast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.getElementById('toast-container').appendChild(el);setTimeout(()=>el.remove(),3500);}

// ── SCREENSHOT ──
function takeScreenshot(){renderer.render(scene,camera);const link=document.createElement('a');link.download=`astral-command-${Date.now()}.png`;link.href=renderer.domElement.toDataURL('image/png');link.click();showToast('📷 Screenshot saved');}

// ── SPEED ──
function updateSpeedDisplay(){document.getElementById('speed-display').textContent=`SPEED: ${simSpeed.toFixed(1)}×`;}

// ── MINIMAP ──
function drawMinimap(){
  const canvas=document.getElementById('minimap-canvas'),ctx=canvas.getContext('2d'),cx=90,cy=90,scale=0.75;
  ctx.fillStyle='rgba(5,5,16,0.9)';ctx.fillRect(0,0,180,180);
  ctx.fillStyle='#FFB800';ctx.beginPath();ctx.arc(cx,cy,3,0,Math.PI*2);ctx.fill();
  planets.forEach(p=>{
    if(!p.data.dist)return;
    const dist=p.data.dist*scale;
    ctx.strokeStyle='rgba(0,255,212,0.1)';ctx.beginPath();ctx.arc(cx,cy,dist,0,Math.PI*2);ctx.stroke();
    const x=cx+Math.cos(p.angle)*dist,y=cy+Math.sin(p.angle)*dist;
    ctx.fillStyle='#'+p.data.color.toString(16).padStart(6,'0');
    ctx.beginPath();ctx.arc(x,y,Math.max(1.5,p.data.radius*0.8),0,Math.PI*2);ctx.fill();
  });
  if(followTarget){const fp=planets.find(p=>p.mesh===followTarget);if(fp){const x=cx+Math.cos(fp.angle)*fp.data.dist*scale,y=cy+Math.sin(fp.angle)*fp.data.dist*scale;ctx.strokeStyle='#00FFD4';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,5,0,Math.PI*2);ctx.stroke();ctx.lineWidth=1;}}
}

// ── MAIN LOOP ──
function animate(){
  requestAnimationFrame(animate);
  const dt=Math.min(clock.getDelta(),0.05);
  if(!paused)simTime+=dt*simSpeed;
  const days=Math.floor(simTime*10),years=Math.floor(days/365),remDays=days%365;
  document.getElementById('sim-time').textContent=years>0?`DAY ${remDays} · YEAR ${years+1}`:`DAY ${days}`;

  // Scale mode
  planets.forEach(p=>{
    if(scaleMode){p.mesh.scale.setScalar(2);}else{p.mesh.scale.setScalar(1);}
  });

  planets.forEach(p=>p.update(dt));
  stationObjs.forEach(s=>s.update(dt));
  if(cometObj)cometObj.update(dt);
  voyagerObjs.forEach(v=>v.update(dt));
  if(asteroids[0]&&!paused)asteroids[0].rotation.y+=dt*0.01*simSpeed;
  if(asteroids[1]&&!paused)asteroids[1].rotation.y-=dt*0.005*simSpeed;

  // Twinkle
  if(starField&&starField.userData.twinklePhase){
    const sizes=starField.geometry.attributes.size;
    if(sizes){const phases=starField.userData.twinklePhase;for(let i=0;i<Math.min(100,phases.length);i++){sizes.array[i]=0.3+0.5*(0.5+0.5*Math.sin(simTime*2+phases[i]));}sizes.needsUpdate=true;}
  }

  // Follow
  if(followTarget){
    const fp=planets.find(p=>p.mesh===followTarget);
    if(fp)targetCamTarget.copy(fp.group.position);
    else if(followTarget.position)targetCamTarget.copy(followTarget.position);
    else targetCamTarget.set(0,0,0);
  }else{targetCamTarget.set(0,0,0);}
  camTarget.lerp(targetCamTarget,0.05);
  camDist+=(targetCamDist-camDist)*0.05;

  camera.position.x=camTarget.x+Math.sin(camPhi)*Math.cos(camTheta)*camDist;
  camera.position.y=camTarget.y+Math.cos(camPhi)*camDist;
  camera.position.z=camTarget.z+Math.sin(camPhi)*Math.sin(camTheta)*camDist;
  camera.lookAt(camTarget);

  document.getElementById('coord-display').textContent=`X:${camera.position.x.toFixed(0)} Y:${camera.position.y.toFixed(0)} Z:${camera.position.z.toFixed(0)}`;

  renderer.render(scene,camera);
  drawMinimap();
  updateLabels();

  // Timeline
  if(timelineMode){document.getElementById('timeline-scrub').value=simTime*10;}
}

window.addEventListener('load',init);