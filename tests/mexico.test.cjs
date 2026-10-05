'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const rules = require('../eight-ball.js');
const Matter = require('../matter.min.js');
const BallVisual = require('../ball-visual.js');
function shot(state, first, sunk = [], { scratch = false, rail = true } = {}) {
    assert(rules.begin(state));
    if (first !== null) rules.contact(state, first);
    if (rail) rules.rail(state, first);
    sunk.forEach(n => rules.sink(state, n));
    if (scratch) rules.sink(state, 0);
    return rules.resolve(state);
}
let s = rules.create();
assert.equal(shot(s, 1, [1]).keeps, true);
assert.deepEqual(s.groups, [null, null], 'break leaves table open');
assert.equal(shot(s, 9, [9]).keeps, true);
assert.deepEqual(s.groups, ['stripes', 'solids']);
assert.equal(shot(s, 10).turn, 1);
assert.equal(shot(s, 3, [2]).keeps, true);
assert.equal(shot(s, 9).foul, 'Primera bola incorrecta');
assert.equal(s.hand, true); s.hand = false;
assert.equal(shot(s, null).foul, 'No tocaste ninguna bola'); s.hand = false;
assert.equal(shot(s, rules.legal(s)[0], [], {rail:false}).foul, 'Sin embocada ni banda después del contacto');
s = rules.create(); assert.equal(shot(s, 8, [8]).winner, 1);
s = rules.create(); s.breaking = false; s.groups = ['solids','stripes']; s.pocketed = [1,2,3,4,5,6,7];
assert.equal(shot(s, 8, [8]).winner, 0); assert.equal(rules.resolve(s), null);
s = rules.create(); s.breaking = false; s.groups = ['solids','stripes']; s.pocketed = [1,2,3,4,5,6,7];
assert.equal(shot(s, 8, [8], {scratch:true}).winner, 1);
s = rules.create(); assert.equal(shot(s, 1, [], {scratch:true}).foul, 'Blanca embocada');
console.log('PASS reglas: rompimiento, mesa abierta, grupos, continuación/cambio, todas las faltas, 8 legal/anticipada/blanca, resolución única');

class Element {
    constructor(id = '') { this.id=id; this.style={setProperty(){}}; this.dataset={};this.events={};this.classes=new Set();this.classList={add:(...c)=>c.forEach(x=>this.classes.add(x)),remove:(...c)=>c.forEach(x=>this.classes.delete(x)),contains:c=>this.classes.has(c),toggle:(c,yes)=>yes?this.classes.add(c):this.classes.delete(c)};this.rect={left:0,top:0,width:960,height:480};this.width=960;this.height=480;this.attrs={};this.value='';this.paint=[]; }
    addEventListener(k,f){(this.events[k] ||= []).push(f)}
    getBoundingClientRect(){return this.rect}
    getContext(){const paint=this.paint;return new Proxy({measureText:t=>({width:t.length*8}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(obj,k)=>obj[k] || ((...args)=>paint.push([k,...args]))});}
    setAttribute(k,v){this.attrs[k]=v} setPointerCapture(id){this.pointer=id} hasPointerCapture(id){return this.pointer===id} releasePointerCapture(){this.pointer=null}
    fire(k,e){(this.events[k]||[]).forEach(f=>f({type:k,preventDefault(){},...e}))}
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const source=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].map(m=>m[1]).join('\n');
new Function(source);
const storage = new Map();
function app() {
    const elements = new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],new Element(m[1])]));
    const screens=[...elements.values()].filter(e=>e.id.startsWith('pantalla-'));
    elements.get('pantalla-inicio').classes.add('activa');
    const selectors = new Map(); let time=0,next=1,confirmValue=true;
    const timers=new Map(),frames=new Map();
    const sandbox={Matter,BallVisual,EightBall:rules,URLSearchParams,console:{log(){},info(){},warn(){},error(){},table(){},assert:assert}, performance:{now:()=>time},
        localStorage:{getItem:k=>storage.get(k) || null,setItem:(k,v)=>storage.set(k,v)},
        document:{getElementById:id=>elements.get(id),querySelector:sel=>{if(!selectors.has(sel))selectors.set(sel,new Element());return selectors.get(sel)},querySelectorAll:()=>screens},
        window:{location:{search:''},devicePixelRatio:1,matchMedia:()=>({matches:true}),addEventListener(){}},
        Image:class { constructor(){this.naturalWidth=1672;this.naturalHeight=941} set src(v){this.onload?.()} },
        requestAnimationFrame:f=>{const id=next++;frames.set(id,f);return id},cancelAnimationFrame:id=>frames.delete(id),
        setTimeout:f=>{const id=next++;timers.set(id,f);return id},clearTimeout:id=>timers.delete(id),confirm:()=>confirmValue,alert(){} };
    vm.createContext(sandbox);vm.runInContext(source,sandbox);
    return {elements,timers,frames,setConfirm:value=>{confirmValue=value},run:code=>vm.runInContext(code,sandbox),advance:ms=>time+=ms,
        timer(){const item=timers.entries().next().value;if(item){timers.delete(item[0]);item[1]()}},
        frame(){time+=16.67;const current=[...frames];frames.clear();current.forEach(([,f])=>f(time))}};
}
(async()=>{
const a=app();
await a.run('abrirMapaMundial()');assert.equal(a.run('estadoApp'),'map');
a.run('iniciarViaje(0)');assert.equal(a.run('estadoApp'),'travelling');
const active=a.frames.size;a.run('iniciarViaje(0)');assert.equal(a.frames.size,active);
for(let i=0;i<35;i++)a.frame();a.timer();
assert.equal(a.run('estadoApp'),'playing');assert.equal(a.run('ballsArr.length'),15);
assert.equal(a.run('controlDisponible()'),true);
a.elements.get('canvas-juego').fire('pointerdown',{pointerId:7,clientX:650,clientY:240});
a.elements.get('canvas-juego').fire('pointerup',{pointerId:7,clientX:650,clientY:240});
const power=a.elements.get('barra-potencia');
power.fire('pointerdown',{pointerId:8,clientX:900,clientY:0});
power.fire('pointermove',{pointerId:8,clientX:900,clientY:414});
power.fire('pointerup',{pointerId:8,clientX:900,clientY:414});
a.advance(120);a.run('actualizarGolpe()');assert.equal(a.run('controlDisponible()'),false);
for(let i=0;i<1800 && a.run('esperandoResultado');i++){a.advance(8.34);a.run('pasoFisicoFijo(); revisarSiSeDetuvieron()');}
assert.equal(a.run('esperandoResultado'),false,'physical break resolves');assert.equal(a.run('partida.breaking'),false);
assert.equal(a.run('partida.shot'),null);
// Set a deterministic physical board to exercise the entire AI lifecycle.
a.run(`iniciarNivel(0,1); partida.breaking=false; partida.turn=1; partida.groups=['stripes','solids'];
    ballsArr.forEach((e,i)=>Matter.Body.setPosition(e.body,{x:620+(i%5)*35,y:140+Math.floor(i/5)*60}));
    Matter.Body.setPosition(cueBall,{x:250,y:240}); actualizarTurno(); programarRival(); programarRival();`);
assert.equal(a.timers.size,1,'only one AI timer');
const positionsBeforeAI=a.run('JSON.stringify(ballsArr.map(e=>e.body.position))');
a.timer();assert.equal(a.run('JSON.stringify(ballsArr.map(e=>e.body.position))'),positionsBeforeAI,'rival only applies cue velocity');
assert.equal(a.run('esperandoResultado'),true);assert.equal(a.run('partida.shot.player'),1);
assert(a.run('partida.shot.legal.every(n=>n>=1&&n<=7)'));
assert(a.run('Math.hypot(cueBall.velocity.x,cueBall.velocity.y)>0'));
for(let i=0;i<1800 && a.run('esperandoResultado');i++){a.advance(8.34);a.run('pasoFisicoFijo(); revisarSiSeDetuvieron()');}
assert.equal(a.run('esperandoResultado'),false,'AI physical shot resolves');
// Pause cancels the rival, resume schedules exactly once, map cancels all game work.
a.run('iniciarNivel(0,1); partida.turn=1; programarRival()');assert.equal(a.timers.size,1);
a.elements.get('btn-pausa').onclick();assert.equal(a.run('estadoApp'),'paused');assert.equal(a.timers.size,0);assert.equal(a.frames.size,0);
a.elements.get('btn-reanudar').onclick();assert.equal(a.timers.size,1);
a.elements.get('btn-reiniciar-nivel').onclick();assert.equal(a.timers.size,0);assert.equal(a.run('partida.turn'),0);assert.equal(a.run('ballsArr.length'),15);
// Cue ball capture recorded by production sink path and foul resolves to ball in hand.
a.run(`efectuarDisparo(.4); EightBall.contact(partida,1); EightBall.rail(partida,1);
    iniciarCaida(cueBall,pockets[0],{distancia:0,velocidadInterior:1});
    [cueBall,...ballsArr.map(e=>e.body)].forEach(b=>Matter.Body.setVelocity(b,{x:0,y:0}));
    tiempoFisicoMs+=300; actualizarCaidas();`);
assert.equal(a.run('Matter.Composite.allBodies(world).includes(cueBall)'),false,'scratched cue cannot interfere while shot finishes');
a.run('revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron()');
assert.equal(a.run('Matter.Composite.allBodies(world).includes(cueBall)'),true);
assert.equal(a.run('partida.hand'),true);assert.equal(a.run('partida.turn'),1);
a.run('cancelarRival(); partida.turn=0');assert.equal(a.run('controlDisponible()'),false);
assert.equal(a.run('colocarBlanca({x:0,y:0})'),false);
a.elements.get('canvas-juego').fire('pointerdown',{pointerId:1,clientX:300,clientY:200});
a.elements.get('canvas-juego').fire('pointerup',{pointerId:1,clientX:300,clientY:200});
assert.equal(a.run('partida.hand'),false);assert.equal(a.run('cueBall.position.x'),300);assert.equal(a.run('controlDisponible()'),true);
// Legal 8 end-to-end resolution, saved progression, reward idempotency, reload.
a.run(`iniciarNivel(0,1); partida.breaking=false; partida.groups=['solids','stripes']; partida.pocketed=[1,2,3,4,5,6,7];
    EightBall.begin(partida); EightBall.contact(partida,8); EightBall.sink(partida,8); esperandoResultado=true;
    revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron();`);
assert.equal(a.run('estadoApp'),'result');assert.equal(a.run('progreso[1].unlocked'),true);assert.equal(a.run('monedasTotales'),10);
a.run('ganarNivel(); revisarSiSeDetuvieron()');assert.equal(a.run('monedasTotales'),10);
a.elements.get('btn-resultado-repetir').onclick();assert.equal(a.run('estadoApp'),'playing');assert.equal(a.run('partida.finished'),false);
a.run('ganarNivel()');assert.equal(a.run('monedasTotales'),10,'replay cannot farm reward');
a.elements.get('btn-resultado-mapa').onclick();await Promise.resolve();assert.equal(a.run('estadoApp'),'map');assert.equal(a.timers.size,0);assert(a.frames.size<=1);
const b=app();assert.equal(b.run('progreso[1].unlocked'),true);assert.equal(b.run('monedasTotales'),10);
b.run(`iniciarNivel(0,1); EightBall.begin(partida); EightBall.contact(partida,8); EightBall.sink(partida,8); esperandoResultado=true;
    revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron();`);
assert.equal(b.run('estadoApp'),'result');assert.equal(b.run('ultimoResultadoVictoria'),false);
b.elements.get('btn-reset-progreso').onclick();const c=app();assert.equal(c.run('progreso[1].unlocked'),false);assert.equal(c.run('monedasTotales'),0);
const italy=c.run("paises.find(p=>p.nombre==='Italia')");
assert.equal(italy.geoX,0.5358883591421577);assert.equal(italy.geoY,0.3582875960482986);
for(const [w,h] of [[1200,675],[844,390],[390,844]]) {
 const actual=c.run(`posicionPais(paises[8],${w},${h})`),bounds=c.run(`obtenerBoundsMapa(${w},${h})`);
 assert(Math.abs((actual.x-bounds.x)/bounds.width-italy.geoX)<1e-12);assert(Math.abs((actual.y-bounds.y)/bounds.height-italy.geoY)<1e-12);
}

// Selector y práctica: no hay rival ni resultado, incluso al embocar la 8.
const modes=app();
const unchanged=JSON.stringify([...storage]);
modes.elements.get('btn-viaje').onclick();assert.equal(modes.run('estadoApp'),'modeSelect');
assert(/id="btn-modo-online" disabled/.test(html));assert.equal(modes.elements.get('btn-modo-online').onclick,undefined);
modes.elements.get('btn-modo-practica').onclick();assert.equal(modes.run('gameMode'),'practice');
assert.equal(modes.run('estadoApp'),'playing');const uniqueEngine=modes.run('engine');
modes.run('partida.turn=1; programarRival()');assert.equal(modes.timers.size,0);
modes.run(`partida.turn=0; efectuarDisparo(.3); EightBall.contact(partida,8); EightBall.sink(partida,8);
    [cueBall,...ballsArr.map(e=>e.body)].forEach(b=>Matter.Body.setVelocity(b,{x:0,y:0}));
    revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron()`);
assert.equal(modes.run('estadoApp'),'playing');assert.equal(modes.run('partida.finished'),false);assert.equal(modes.run('controlDisponible()'),true);
modes.elements.get('btn-practica-mano').onclick();assert.equal(modes.run('partida.hand'),true);
modes.elements.get('canvas-juego').fire('pointerdown',{pointerId:2,clientX:300,clientY:180});
modes.elements.get('canvas-juego').fire('pointerup',{pointerId:2,clientX:300,clientY:180});
assert.equal(modes.run('partida.hand'),false);
modes.elements.get('btn-practica-rack').onclick();assert.equal(modes.run('cueBall.position.x'),300);assert.equal(modes.run('ballsArr.length'),15);
modes.elements.get('btn-reiniciar-nivel').onclick();assert.equal(modes.run('cueBall.position.x'),255);
modes.elements.get('btn-pausa').onclick();assert.equal(modes.elements.get('pausa-modo').textContent,'PRÁCTICA');
modes.elements.get('btn-salir-pausa').onclick();assert.equal(modes.run('estadoApp'),'menu');assert.equal(modes.frames.size,0);
// Dos personas: nombres opcionales, ambos controlan la mesa, reglas y revancha sin guardar.
modes.elements.get('btn-viaje').onclick();modes.elements.get('btn-modo-local').onclick();
modes.elements.get('nombre-local-1').value='Ana';modes.elements.get('nombre-local-2').value='   ';
modes.elements.get('nombres-local').fire('submit',{});
assert.equal(modes.run('gameMode'),'localMatch');assert.equal(modes.elements.get('nombre-jugador').textContent,'Ana');
assert.equal(modes.elements.get('nombre-rival').textContent,'JUGADOR 2');
modes.run(`partida.breaking=false; EightBall.begin(partida); EightBall.contact(partida,1); EightBall.rail(partida,1);
    esperandoResultado=true; revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron()`);
assert.equal(modes.run('partida.turn'),1);assert.equal(modes.run('controlDisponible()'),true);assert.equal(modes.timers.size,0);
assert(modes.elements.get('turno-chip').textContent.includes('JUGADOR 2'));
modes.run(`EightBall.begin(partida); EightBall.contact(partida,2); EightBall.sink(partida,2);
    esperandoResultado=true; revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron()`);
assert.equal(modes.run('partida.turn'),1);assert.equal(modes.run('partida.groups[1]'),'solids');
modes.run(`partida.pocketed=[1,2,3,4,5,6,7]; EightBall.begin(partida); EightBall.contact(partida,8); EightBall.sink(partida,8);
    esperandoResultado=true; revisarSiSeDetuvieron(); tiempoFisicoMs+=200; revisarSiSeDetuvieron()`);
assert.equal(modes.run('estadoApp'),'result');assert(modes.elements.get('resultado-titulo').textContent.includes('JUGADOR 2'));
assert.equal(modes.elements.get('btn-resultado-repetir').textContent,'REVANCHA');
modes.elements.get('btn-resultado-repetir').onclick();assert.equal(modes.run('partida.turn'),0);
modes.elements.get('btn-resultado-mapa').onclick();assert.equal(modes.run('estadoApp'),'menu');
assert.equal(JSON.stringify([...storage]),unchanged,'practice/local cannot save or award rewards');
const listenerCount=modes.elements.get('canvas-juego').events.pointerdown.length;
for(let i=0;i<6;i++) {
 modes.elements.get('btn-viaje').onclick();modes.elements.get('btn-modo-practica').onclick();
 modes.elements.get('btn-pausa').onclick();modes.setConfirm(false);modes.elements.get('btn-cambiar-modo').onclick();
 assert.equal(modes.run('estadoApp'),'paused');modes.setConfirm(true);modes.elements.get('btn-cambiar-modo').onclick();
 assert.equal(modes.run('estadoApp'),'modeSelect');assert.equal(modes.frames.size,0);
 modes.elements.get('btn-modo-gira').onclick();await Promise.resolve();
 assert.equal(modes.run('estadoApp'),'map');assert.equal(modes.run('gameMode'),'worldTour');
 modes.run('iniciarNivel(0,1); partida.turn=1; programarRival()');assert.equal(modes.timers.size,1);
 const staleRival=[...modes.timers.values()][0];modes.run("elegirModo('practice')");staleRival();
 assert.equal(modes.run('esperandoResultado'),false);assert.equal(modes.timers.size,0);
 modes.elements.get('btn-salir-juego').onclick();
}
assert.equal(modes.run('engine'),uniqueEngine,'single engine across all modes');
assert.equal(modes.elements.get('canvas-juego').events.pointerdown.length,listenerCount,'no duplicated controls');
// Orientación visual por distancia/radio y cambios de dirección, sin movimiento propio.
const v=BallVisual.create({x:0,y:0});BallVisual.advance(v,{x:11,y:0},11);
assert(Math.abs(BallVisual.project(v,[0,0,1]).x-Math.sin(1))<1e-12);
const frozen=JSON.stringify(v.q);for(let i=0;i<100;i++)BallVisual.advance(v,{x:11,y:0},11);
assert.equal(JSON.stringify(v.q),frozen);BallVisual.advance(v,{x:0,y:0},11);assert(Math.abs(v.q[0]-1)<1e-12);
BallVisual.advance(v,{x:0,y:11},11);assert(Math.abs(BallVisual.project(v,[0,0,1]).y)>.5);
const reduced=BallVisual.create({x:0,y:0});BallVisual.advance(reduced,{x:11,y:0},11,true);
assert(Math.abs(BallVisual.project(reduced,[0,0,1]).x)>.1);
// El dibujo de lisas, rayadas y blanca cambia con su orientación; una quieta conserva q.
modes.run("elegirModo('practice')");
const paint=modes.elements.get('canvas-juego').paint;
for(const n of [1,9,0]) {
 modes.run(`var drawingVisual=BallVisual.create({x:0,y:0}); dibujarBola(100,100,${n},drawingVisual,true)`);
 const initial=JSON.stringify(paint.splice(0));
 modes.run(`BallVisual.advance(drawingVisual,{x:7,y:4},11); dibujarBola(100,100,${n},drawingVisual,true)`);
 const rolled=JSON.stringify(paint.splice(0));assert.notEqual(initial,rolled,`visible rolling for ball ${n}`);
}
modes.run(`Matter.Body.setVelocity(cueBall,{x:3,y:0}); pasoFisicoFijo()`);
assert.notEqual(modes.run('JSON.stringify(cueBall.plugin.visual.q)'),'[1,0,0,0]');
modes.run(`Matter.Body.setVelocity(cueBall,{x:0,y:0}); BallVisual.anchor(cueBall.plugin.visual,cueBall.position)`);
const qBefore=modes.run('JSON.stringify(cueBall.plugin.visual.q)');modes.run('actualizarRodamiento(); draw(); draw()');
assert.equal(modes.run('JSON.stringify(cueBall.plugin.visual.q)'),qBefore);
modes.elements.get('btn-salir-juego').onclick();assert.equal(modes.frames.size,0);
console.log('PASS modos: selector, práctica sin fin, bola en mano, local con turnos/ganador/revancha, gira con IA, cambio confirmado, sin guardado ni listeners/motores duplicados');
console.log('PASS rodamiento: lisas/rayadas/blanca, distancia/radio, rebotes, reduced-motion, reposo y cancelación del render');
console.log('PASS coordenadas aprobadas de Italia después de resize');
console.log('PASS integración Matter.js: inicio/mapa/viaje, rompimiento físico, rival completo, pausa, reinicio, blanca/colocación táctil, victoria/derrota, recompensa única, mapa, recarga y reset');
})().catch(e=>{console.error(e);process.exitCode=1});
