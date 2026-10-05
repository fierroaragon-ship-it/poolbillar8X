/* Rodamiento de una esfera calculado por desplazamiento; no toca la física. */
(function (root) {
    'use strict';
    function create(position) { return { x:position.x, y:position.y, q:[1,0,0,0] }; }
    function anchor(state, position) { state.x=position.x; state.y=position.y; }
    function advance(state, position, radius, reduced = false) {
        const dx=position.x-state.x, dy=position.y-state.y;
        anchor(state,position);
        const distance=Math.hypot(dx,dy);
        if (distance < 1e-7 || radius <= 0) return;
        const half=distance/radius * (reduced ? .55 : 1) / 2;
        const c=Math.cos(half), scale=Math.sin(half)/distance;
        // Eje perpendicular al recorrido: la inversión del recorrido invierte el giro.
        const ax=-dy*scale, ay=dx*scale, [w,x,y,z]=state.q;
        const q=[c*w-ax*x-ay*y, c*x+ax*w+ay*z, c*y+ay*w-ax*z, c*z+ax*y-ay*x];
        const norm=Math.hypot(...q);
        state.q=q.map(v=>v/norm);
    }
    function project(state, vector) {
        const [w,x,y,z]=state.q, [vx,vy,vz]=vector;
        const tx=2*(y*vz-z*vy), ty=2*(z*vx-x*vz), tz=2*(x*vy-y*vx);
        return {x:vx+w*tx+y*tz-z*ty, y:vy+w*ty+z*tx-x*tz, z:vz+w*tz+x*ty-y*tx};
    }
    const api={create,anchor,advance,project};
    if (typeof module !== 'undefined' && module.exports) module.exports=api;
    else root.BallVisual=api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
