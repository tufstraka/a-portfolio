// One stroke vocabulary for DOM controls, world signs, and the minimap.
const paths = {
    person: 'M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21v-2a8 8 0 0 1 16 0v2',
    code: 'm8 6-6 6 6 6m8-12 6 6-6 6m-3-15-2 18',
    projects: 'M3 7h7l2-3h9v16H3ZM3 10h18',
    work: 'M8 6V3h8v3M3 7h18v14H3ZM3 12l9 3 9-3M12 12v5',
    contact: 'M3 5h18v14H3ZM3 6l9 7 9-7',
    car: 'm4 10 2-6h12l2 6M3 10h18v8H3ZM5 18v3m14-3v3M6 14h2m8 0h2',
    boost: 'm13 2-9 12h7l-1 8 10-13h-8Z',
    target: 'M20 12a8 8 0 1 1-16 0 8 8 0 0 1 16 0M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0M12 1v3m0 16v3M1 12h3m16 0h3',
    flag: 'M5 22V3h14l-3 5 3 5H5',
    road: 'M7 2 3 22M17 2l4 20M12 3v3m0 5v3m0 5v3',
    game: 'M7 8h10c4 0 7 12 3 12l-5-4H9l-5 4C0 20 3 8 7 8ZM7 10v4m-2-2h4m7-1h1m1 3h1',
    jump: 'M12 20V4m-7 7 7-7 7 7M4 21h16',
    drift: 'M3 6h12a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8M3 10h4m-5 4h2',
    settings: 'M4 7h16M4 17h16M8 4v6m8 4v6',
    radio: 'M3 8h18v13H3ZM5 8l13-6M7 12v5m3-5v5m4-4h4m-4 4h4',
    sound: 'M3 9h4l5-5v16l-5-5H3ZM16 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14',
    muted: 'M3 9h4l5-5v16l-5-5H3ZM16 9l5 6m0-6-5 6',
    enter: 'M20 4v10H4m6-6-6 6 6 6',
    clock: 'M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0M12 6v6l4 2',
    reset: 'M3 10a9 9 0 1 1 1 8M3 3v7h7',
    warning: 'm12 2 10 19H2ZM12 8v6m0 3v1'
};
const canvasPaths = new Map();
export function iconSvg(name) {
    return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${paths[name] || paths.target}"/></svg>`;
}
export function drawIcon(ctx, name, x, y, size, color = '#101d30') {
    const key = paths[name] ? name : 'target';
    if (!canvasPaths.has(key)) canvasPaths.set(key, new Path2D(paths[key]));
    ctx.save();
    ctx.translate(x - size / 2, y - size / 2);
    ctx.scale(size / 24, size / 24);
    ctx.strokeStyle = color; ctx.lineWidth = 1.8; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.stroke(canvasPaths.get(key));
    ctx.restore();
}
export function setupIcons() {
    document.querySelectorAll('[data-icon]').forEach(el => { el.innerHTML = iconSvg(el.dataset.icon); });
}
