/* Reglas de la partida: sin dependencias y sin modificar cuerpos físicos. */
(function (root) {
    'use strict';
    const group = n => n >= 1 && n <= 7 ? 'solids' : n >= 9 && n <= 15 ? 'stripes' : null;
    function create() { return { turn: 0, groups: [null, null], pocketed: [], breaking: true, hand: false, finished: false, shot: null }; }
    function legal(state, player = state.turn) {
        const remaining = Array.from({ length: 15 }, (_, i) => i + 1).filter(n => !state.pocketed.includes(n));
        const assigned = state.groups[player];
        if (!assigned) return remaining.filter(n => n !== 8);
        const own = remaining.filter(n => group(n) === assigned);
        return own.length ? own : remaining.filter(n => n === 8);
    }
    function begin(state) {
        if (state.finished || state.shot || state.hand) return false;
        state.shot = { player: state.turn, legal: legal(state), first: null, rail: false, rails: [], sunk: [], scratch: false, resolved: false };
        return true;
    }
    function contact(state, number) { if (state.shot && state.shot.first === null) state.shot.first = number; }
    function rail(state, number) {
        if (!state.shot || state.shot.first === null) return;
        state.shot.rail = true;
        if (number && !state.shot.rails.includes(number)) state.shot.rails.push(number);
    }
    function sink(state, number) {
        if (!state.shot) return;
        if (number === 0) state.shot.scratch = true;
        else if (!state.shot.sunk.includes(number)) state.shot.sunk.push(number);
    }
    function resolve(state) {
        const shot = state.shot;
        if (!shot || shot.resolved || state.finished) return null;
        shot.resolved = true;
        let foul = shot.scratch ? 'Blanca embocada' : shot.first === null ? 'No tocaste ninguna bola'
            : !shot.legal.includes(shot.first) ? 'Primera bola incorrecta'
            : !shot.sunk.length && !shot.rail ? 'Sin embocada ni banda después del contacto' : null;
        if (state.breaking && !shot.sunk.length && shot.rails.length < 4 && !foul) foul = 'Rompimiento: deben tocar banda cuatro bolas';
        state.pocketed = [...new Set([...state.pocketed, ...shot.sunk])];
        if (shot.sunk.includes(8)) {
            const win = !foul && shot.legal.length === 1 && shot.legal[0] === 8;
            state.finished = true; state.shot = null;
            return { winner: win ? shot.player : 1 - shot.player, foul, reason: win ? 'Bola 8 legal' : foul || 'Bola 8 anticipada' };
        }
        if (!state.breaking && !foul && !state.groups[shot.player]) {
            const assigned = group(shot.sunk.find(n => group(n)));
            if (assigned) { state.groups[shot.player] = assigned; state.groups[1 - shot.player] = assigned === 'solids' ? 'stripes' : 'solids'; }
        }
        const keeps = !foul && shot.sunk.some(n => state.groups[shot.player] ? group(n) === state.groups[shot.player] : !!group(n));
        state.breaking = false;
        state.turn = keeps ? shot.player : 1 - shot.player;
        state.hand = !!foul; state.shot = null;
        return { winner: null, foul, keeps, turn: state.turn };
    }
    const api = { group, create, legal, begin, contact, rail, sink, resolve };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.EightBall = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
