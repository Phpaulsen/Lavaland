/* ---------- Bilder für die Tasten: SVG-Pfade für Fahrzeuge, Werkzeuge, Aktionen und Aufgaben (Tinte K, Strichstile S1, S2) ---------- */
// PR 29g2a. Unverändert aus legacy.js bewegt (Deklarationen und Ergänzungen in derselben Reihenfolge). Reine Zeichenketten, keine Abhängigkeiten.

export const K='#1d2a3a';

/* ---------- Bilder für die Tasten ---------- */
export const S1='stroke="'+K+'" stroke-linejoin="round" stroke-linecap="round"';
/** @type {Record<string, string>} */
export const IC={
  walk:'<circle cx="12" cy="4.5" r="3" fill="'+K+'"/><path d="M12 9v7M12 16l-4 6M12 16l4 6M6 13l6-3 6 3" '+S1+' stroke-width="2.6" fill="none"/>',
  car:'<path d="M2 16v-4l2-1 3-5h8l4 5 3 1v4z" fill="#e63946" '+S1+' stroke-width="1.6"/><circle cx="7" cy="17" r="2.8" fill="'+K+'"/><circle cx="17" cy="17" r="2.8" fill="'+K+'"/>',
  plane:'<path d="M3 10V4l5 5z" fill="#2f6fd6" '+S1+' stroke-width="1.4"/><path d="M2 12c0-2 3-3 7-3h8c3 0 5 1.4 5 3s-2 3-5 3H9c-4 0-7-1-7-3z" fill="#ffc21a" '+S1+' stroke-width="1.6"/><path d="M9 13h9l-6 7H9z" fill="#2f6fd6" '+S1+' stroke-width="1.4"/>',
  bagger:'<rect x="1.5" y="17" width="14" height="5" rx="2.5" fill="'+K+'"/><path d="M3 17v-5h4V7h5l2 5v5z" fill="#ffc21a" '+S1+' stroke-width="1.5"/><path d="M11 11l6-8 4 6" fill="none" '+S1+' stroke-width="2.6"/><path d="M18.5 8.5l4 1.5-1.5 5-4.5-1.5z" fill="'+K+'"/>',
  coaster:'<path d="M1 20c4 0 4-14 8-14s3 12 7 12 3-7 7-7" stroke="#e0304a" stroke-width="3" stroke-linecap="round" fill="none"/><rect x="5" y="2.5" width="8" height="5" rx="1.5" fill="#7b4fd6" '+S1+' stroke-width="1.4"/>',
  lava:'<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" fill="#ff5a1f" '+S1+' stroke-width="1.6"/><path d="M12 11c2 3 3 4 3 6a3 3 0 0 1-6 0c0-2 1-3 3-6z" fill="#ffd23f"/>',
  fire:'<path d="M13 2c0 4 6 6 6 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 2 3 3 3 1-2 2-5 2-8z" fill="#ff9a1f" '+S1+' stroke-width="1.6"/><path d="M12 13c1 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffe066"/>',
  water:'<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z" fill="#3aa0e8" '+S1+' stroke-width="1.6"/><path d="M9 15a3.4 3.4 0 0 0 3 3.4" stroke="#fff" stroke-width="2" stroke-linecap="round" fill="none"/>',
  ice:'<path d="M12 2l8.5 4.5v10L12 21l-8.5-4.5v-10z" fill="#bfeaf7" '+S1+' stroke-width="1.6"/><path d="M3.5 6.5L12 11l8.5-4.5M12 11v10" fill="none" '+S1+' stroke-width="1.6"/><path d="M7 11.5v3" stroke="#fff" stroke-width="2" stroke-linecap="round"/>',
  earth:'<path d="M2 21c1.5-8 5.5-13 10-13s8.5 5 10 13z" fill="#8a5a3c" '+S1+' stroke-width="1.6"/><path d="M6.5 12.5c2.5-3.5 8.5-3.5 11 0" stroke="#58b548" stroke-width="3.4" stroke-linecap="round" fill="none"/>',
  blocks:'<rect x="2.5" y="12.5" width="9" height="9" rx="1" fill="#e2574c" '+S1+' stroke-width="1.6"/><rect x="12.5" y="12.5" width="9" height="9" rx="1" fill="#4f9ad8" '+S1+' stroke-width="1.6"/><rect x="7.5" y="2.5" width="9" height="9" rx="1" fill="#f2b632" '+S1+' stroke-width="1.6"/>',
  track:'<path d="M3 21L10 3M14 21l7-18" stroke="#e0304a" stroke-width="2.6" stroke-linecap="round"/><path d="M5 17h11M7 12h11M9 7h11" '+S1+' stroke-width="2.2"/>',
  erase:'<path d="M8 20l-5-5L14 4l7 7-9 9z" fill="#ff9fb0" '+S1+' stroke-width="1.6"/><path d="M3 15l5 5h4l3-3-7-7z" fill="#fff8e6" '+S1+' stroke-width="1.6"/>',
  star:'<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21.1l1.5-7L2 9.3l7-.8z" fill="#ffd23f" '+S1+' stroke-width="1.6"/>',
  reset:'<path d="M5 12a7 7 0 1 0 2.5-5.4" '+S1+' stroke-width="2.6" fill="none"/><path d="M3 3l1.5 6L10 7z" fill="'+K+'"/>'
};
/** @type {Record<string, string>} */
export const AI={
  jump:'<path d="M12 3l8 9h-5v9H9v-9H4z" fill="currentColor"/>',
  chute:'<path d="M2.5 11a9.5 9.5 0 0 1 19 0z" fill="currentColor"/><path d="M3 11l9 10 9-10M12 11v10" stroke="currentColor" stroke-width="1.8" fill="none" stroke-linecap="round"/>',
  down:'<path d="M12 21l8-9h-5V3H9v9H4z" fill="currentColor"/>',
  turbo:'<path d="M13.5 2L4 14h6l-1.5 8L19 10h-6z" fill="currentColor"/>',
  exit:'<path d="M12 4H5v16h7" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 12h11m-4.5-4.5L21 12l-4.5 4.5" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>',
  dig:'<path d="M3 4l7 2 2 6" stroke="currentColor" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 11l8 1.5-1 8-8-3z" fill="currentColor"/><path d="M19 15v6M16 18.5l3 2.5 3-2.5" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>'
};
export const S2=S1+' stroke-width="2.5"';
/** @type {Record<string, string>} */
export const QI={
  haus:'<path d="M2.5 11.5L12 3l9.5 8.5z" fill="#e2574c" '+S1+' stroke-width="1.5"/><rect x="5" y="11.5" width="14" height="9.5" fill="#f2b632" '+S1+' stroke-width="1.5"/><rect x="10" y="14.5" width="4" height="6.5" fill="#7a4a2c"/>',
  mond:'<path d="M15 3a9 9 0 1 0 6 13A8 8 0 0 1 15 3z" fill="#ffd23f" '+S1+' stroke-width="1.5"/>',
  sonne:'<circle cx="12" cy="12" r="5" fill="#ffd23f" '+S1+' stroke-width="1.5"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2" '+S1+' stroke-width="1.8"/>',
  baum:'<rect x="10.5" y="13" width="3" height="9" fill="#7a4a2c" '+S1+' stroke-width="1.2"/><circle cx="12" cy="9" r="7" fill="#3fa85a" '+S1+' stroke-width="1.5"/>',
  wolke:'<path d="M6.5 18a4.5 4.5 0 0 1 .3-9 6 6 0 0 1 11.4 1.3A3.9 3.9 0 0 1 17.5 18z" fill="#fff" '+S1+' stroke-width="1.6"/>',
  apfel:'<path d="M12 8c-3-2.5-8-.5-8 5 0 4.5 3 8.5 5.5 8.5 1 0 1.5-.5 2.5-.5s1.5.5 2.5.5c2.5 0 5.5-4 5.5-8.5 0-5.5-5-7.5-8-5z" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 8c0-2 .5-3.5 2-5" fill="none" '+S1+' stroke-width="1.6"/><path d="M14.5 5c1.5-1.5 3.5-1.5 4.5-1-.5 1.5-2.5 2.5-4.5 1z" fill="#58b548" '+S1+' stroke-width="1.2"/>',
  ball:'<circle cx="12" cy="12" r="9" fill="#4f9ad8" '+S1+' stroke-width="1.5"/><path d="M3.5 9.500c5 2.5 12 2.5 17 0M3.5 14.500c5-2.5 12-2.5 17 0" fill="none" stroke="#ffd23f" stroke-width="2"/>',
  fisch:'<path d="M2.5 12c3-5 9-6.5 13.5-2l5-3.500v11L16 14c-4.5 4.5-10.5 3-13.5-2z" fill="#ff8a1f" '+S1+' stroke-width="1.5"/><circle cx="7" cy="11" r="1.3" fill="'+K+'"/>',
  banane:'<path d="M4 7c1 7 6 12 14 11 1.500-.200 2.500-1 2.500-2-6 1-11-3-13-10z" fill="#f5d33f" '+S1+' stroke-width="1.500"/><path d="M4 7l-.800-2.200 1.600-.300z" fill="#6b4a2b"/>',
  tomate:'<circle cx="12" cy="13.500" r="7.500" fill="#e2423c" '+S1+' stroke-width="1.500"/><path d="M8 7.500l2.500 1 1.500-3 1.500 3 2.500-1-1 2.500h-6z" fill="#3fa34d" '+S1+' stroke-width="1.200"/>',
  maus:'<path d="M3 17c0-5 4-8 9-8s8 3 8 7v1H3z" fill="#9aa3ad" '+S1+' stroke-width="1.5"/><circle cx="8" cy="8.5" r="2.8" fill="#c7cdd4" '+S1+' stroke-width="1.3"/><circle cx="18.5" cy="14" r="1" fill="'+K+'"/><path d="M3 17c-1.500 0-2 2 0 3" '+S1+' stroke-width="1.3" fill="none"/>',
  tisch:'<rect x="2.5" y="8" width="19" height="3.500" rx="1" fill="#b77a47" '+S1+' stroke-width="1.500"/><path d="M5 11.500V20M19 11.500V20" '+S1+' stroke-width="2.200"/>',
  tonne:'<path d="M5.500 7h13l-1.500 14h-10z" fill="#5a8f4e" '+S1+' stroke-width="1.500"/><rect x="4" y="4.500" width="16" height="2.800" rx="1" fill="#6fa862" '+S1+' stroke-width="1.400"/><path d="M10 10v8M14 10v8" '+S1+' stroke-width="1.200"/>',
  hose:'<path d="M6 3h12l1.500 18h-5L12 10l-2.500 11h-5z" fill="#3b6fd1" '+S1+' stroke-width="1.500"/><path d="M6 6h12" '+S1+' stroke-width="1.200"/>',
  rose:'<path d="M12 13v9" stroke="#2f8a3e" stroke-width="2" stroke-linecap="round"/><path d="M12 18c2-2 4-2 5-1-1 2-3 2-5 1z" fill="#3fa34d"/><circle cx="12" cy="8.500" r="5" fill="#e2423c" '+S1+' stroke-width="1.500"/><path d="M10 8.500c1-2 3-2 4 0-1 1.500-3 1.500-4 0z" fill="#b8312c"/>',
  tanne:'<path d="M12 2l6 8h-3l5 7H4l5-7H6z" fill="#2f8a4a" '+S1+' stroke-width="1.500"/><rect x="10.500" y="17" width="3" height="4.500" fill="#7a4a2c" '+S1+' stroke-width="1.200"/>',
  kanne:'<path d="M6 13.500L2 9.500" '+S1+' stroke-width="2.600"/><path d="M19 11.500c3.500 0 3.500 6 0 6" '+S1+' stroke-width="1.800" fill="none"/><path d="M5 12.500c0-2.500 3-4 7-4s7 1.500 7 4V16c0 3-3 4.500-7 4.500S5 19 5 16z" fill="#e5a33a" '+S1+' stroke-width="1.500"/><path d="M8 8.500c0-2.500 8-2.500 8 0z" fill="#f2c26b" '+S1+' stroke-width="1.400"/><circle cx="12" cy="5" r="1.300" fill="#f2c26b" '+S1+' stroke-width="1.200"/>',
  lock:'<path d="M8 10.5V7.500a4 4 0 0 1 8 0v3" fill="none" '+S1+' stroke-width="2.6"/><rect x="5" y="10.5" width="14" height="10.5" rx="2.5" fill="#ffd23f" '+S1+' stroke-width="1.6"/>'
};

IC.rocket='<path d="M8 13l-3.5 6 3.5-1zM16 13l3.5 6-3.5-1z" fill="#e63946" '+S1+' stroke-width="1.3"/><path d="M10 17.5l2 4.5 2-4.5z" fill="#ffd23f" '+S1+' stroke-width="1.2"/><path d="M12 2c4 3 5 8.5 4 15.5H8C7 10.5 8 5 12 2z" fill="#f3f1ea" '+S1+' stroke-width="1.5"/><path d="M12 2c1.9 1.4 3.2 3.4 3.8 5.800H8.2C8.800 5.4 10.1 3.4 12 2z" fill="#e63946" '+S1+' stroke-width="1.5"/><circle cx="12" cy="11.5" r="2.1" fill="#bfe9f5" '+S1+' stroke-width="1.3"/>';
IC.loader='<path d="M2.5 16v-5h5V6h5l1.5 5h2v5z" fill="#f2a81d" '+S1+' stroke-width="1.5"/><path d="M15 12.5l3 1" fill="none" '+S1+' stroke-width="2.4"/><path d="M17 9.5h4.5l1.5 6.5h-6z" fill="'+K+'"/><circle cx="6.5" cy="17.5" r="3.3" fill="'+K+'"/><circle cx="14" cy="17.5" r="3.3" fill="'+K+'"/>';
IC.dumper='<path d="M1.5 6.5h13.5l-1.5 8.500H3z" fill="#f2a81d" '+S1+' stroke-width="1.5"/><path d="M16 9h3.5l3 4v3.5H16z" fill="#2f6fd6" '+S1+' stroke-width="1.5"/><path d="M2 16.5h20.5" '+S1+' stroke-width="2"/><circle cx="6" cy="18.5" r="2.900" fill="'+K+'"/><circle cx="18.5" cy="18.5" r="2.900" fill="'+K+'"/>';
IC.tbm='<rect x="1.5" y="6.5" width="13.5" height="11" rx="3" fill="#9aa7b4" '+S1+' stroke-width="1.5"/><rect x="1.5" y="10" width="13.5" height="3" fill="#ffc21a"/><rect x="2" y="18" width="12.5" height="3.2" rx="1.6" fill="'+K+'"/><ellipse cx="18.5" cy="12" rx="3.6" ry="9" fill="#ff8a1f" '+S1+' stroke-width="1.5"/><path d="M17 7.5h3M16.5 12h4M17 16.5h3" '+S1+' stroke-width="1.6"/>';
QI.hand='<path d="M14.5 3.5l6 6L10 20l-6.5 .5L4 14z" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M3.5 20.5L4 14l6 6z" fill="#7a4a2c" '+S1+' stroke-width="1.4"/><path d="M12 6l6 6" '+S1+' stroke-width="1.6"/>';
QI.gem='<path d="M6 4h12l4 6-10 11L2 10z" fill="#5fd4e6" '+S1+' stroke-width="1.6"/><path d="M2 10h20M9 4l-2 6 5 11 5-11-2-6" fill="none" '+S1+' stroke-width="1.2"/>';
QI.save='<path d="M4 4h12.5L20 7.5V20H4z" fill="#4f9ad8" '+S1+' stroke-width="1.6"/><rect x="7.5" y="4" width="7.5" height="5" fill="#fff8e6" '+S1+' stroke-width="1.2"/><rect x="7" y="13" width="10" height="7" fill="#fff8e6" '+S1+' stroke-width="1.2"/>';
QI.fs='<path d="M3 9V3h6M15 3h6v6M21 15v6h-6M9 21H3v-6" fill="none" '+S1+' stroke-width="2.6"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5" fill="#4f9ad8" '+S1+' stroke-width="1.5"/>';
QI.fsx='<path d="M9 3v6H3M21 9h-6V3M15 21v-6h6M3 15h6v6" fill="none" '+S1+' stroke-width="2.6"/>';
QI.exp='<path d="M3 13v8h18v-8" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M12 15V3M7 7.5L12 3l5 4.5" fill="none" stroke="#2f8f4a" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';
QI.imp='<path d="M3 13v8h18v-8" fill="#f2b632" '+S1+' stroke-width="1.6"/><path d="M12 3v12M7 10.5L12 15l5-4.5" fill="none" stroke="#2f6fd6" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>';

IC.shovel='<path d="M17 3l4 4M19 5l-8.500 8.500" '+S1+' stroke-width="2.600"/><path d="M10.500 9.500l4 4-4.500 4.500c-2 2-5.500 2.500-7.500 2.500 0-2 .5-5.500 2.500-7.500z" fill="#9aa7b4" '+S1+' stroke-width="1.500"/>';
IC.pick='<path d="M4 21L15 10" stroke="#a0632f" stroke-width="3.2" stroke-linecap="round"/><path d="M4 21L15 10" '+S1+' stroke-width="1" fill="none"/><path d="M8 4.500c4-2 9-1.500 12.500 1.500l-1 1c-3-1.500-6-1.500-8.500 0zM20.500 6c2 4 1.500 8.500-1 12l-1-1c1.500-2.500 1.500-6 0-9z" fill="#9aa7b4" '+S1+' stroke-width="1.400"/><path d="M13 8l3 3" '+S1+' stroke-width="3.200"/>';
IC.bow='<path d="M6 3c8 2 13 7 15 15" stroke="#a0632f" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M6 3c8 2 13 7 15 15" '+S1+' stroke-width="1" fill="none"/><path d="M6 3l15 15" stroke="'+K+'" stroke-width="1.200"/><path d="M3 21L17 7" '+S1+' stroke-width="2"/><path d="M17 7l1-4 3 3z" fill="#9aa7b4" '+S1+' stroke-width="1.200"/><path d="M3 21l1-3.500M3 21l3.500-1" stroke="#e63946" stroke-width="2.200" stroke-linecap="round"/>';
IC.tnt='<circle cx="10.5" cy="14.5" r="7.5" fill="#3a3438" '+S1+' stroke-width="1.6"/><path d="M15.5 9l3-3" '+S1+' stroke-width="2.4"/><path d="M18.5 6l.8-3M18.5 6l3-.6M18.5 6l2.4 1.800" stroke="#ff8a1f" stroke-width="1.8" stroke-linecap="round"/><path d="M7 12a4 4 0 0 1 3-2" stroke="#fff" stroke-width="1.6" stroke-linecap="round" fill="none"/>';

QI.bolt='<path d="M13.5 2L4 14h6l-1.5 8L19 10h-6z" fill="#ffd23f" '+S1+' stroke-width="1.6"/>';
QI.gear='<path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M18.7 5.3l-2.1 2.1M7.4 16.6l-2.1 2.1" '+S1+' stroke-width="3"/><circle cx="12" cy="12" r="6.5" fill="#9aa7b4" '+S1+' stroke-width="1.6"/><circle cx="12" cy="12" r="2.6" fill="#fff8e6" '+S1+' stroke-width="1.4"/>';
QI.sound='<path d="M3 9h4l5-4v14l-5-4H3z" fill="'+K+'"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" '+S1+' stroke-width="2.2" fill="none"/>';
QI.talk='<path d="M4 5h16v10H10l-5 4v-4H4z" fill="'+K+'"/><circle cx="9" cy="10" r="1.3" fill="#fff"/><circle cx="12.5" cy="10" r="1.3" fill="#fff"/><circle cx="16" cy="10" r="1.3" fill="#fff"/>';
QI.mute='<path d="M3 9h4l5-4v14l-5-4H3z" fill="'+K+'"/><path d="M16 9l5 6M21 9l-5 6" stroke="#e63946" stroke-width="2.6" stroke-linecap="round"/>';

IC.ski='<path d="M3 17.5l17 4.500" '+S1+' stroke-width="2.6"/><circle cx="14" cy="4.5" r="2.800" fill="#e63946" '+S1+' stroke-width="1.2"/><path d="M13.5 8.500L10 13l4.500 3-1.500 3.500M12 10.500l5.500 2" '+S1+' stroke-width="2.4" fill="none"/>';
IC.snow='<path d="M12 2v20M3.300 7l17.400 10M20.700 7L3.300 17M12 2l-2.500 2.500M12 2l2.500 2.500M12 22l-2.500-2.500M12 22l2.500-2.500" stroke="#3aa0e8" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
IC.ball='<circle cx="14.500" cy="12" r="7" fill="#fff" '+S1+' stroke-width="1.6"/><path d="M2 8h4M1 12h4.500M2 16h4" '+S1+' stroke-width="2"/>';
IC.man='<circle cx="12" cy="16" r="6" fill="#fff" '+S1+' stroke-width="1.5"/><circle cx="12" cy="7.500" r="4" fill="#fff" '+S1+' stroke-width="1.5"/><path d="M12 8l4.500 1" stroke="#ff8a1f" stroke-width="2.200" stroke-linecap="round"/><rect x="8.500" y="1.200" width="7" height="3" fill="'+K+'"/>';
IC.fw='<path d="M12 12V3M12 12l6.400-6.400M12 12h9M12 12l6.400 6.400M12 12v9M12 12l-6.400 6.400M12 12H3M12 12L5.600 5.600" stroke="#e63946" stroke-width="2.200" stroke-linecap="round"/><circle cx="12" cy="12" r="2.800" fill="#ffd23f" '+S1+' stroke-width="1.2"/>';
IC.dragon='<path d="M6 9l-4-5 7 2z" fill="#a02622" '+S1+' stroke-width="1.2"/><path d="M2 16c0-4.500 3.500-7.500 8.500-7.500l2.500-4 1.500 4c4 .5 7.500 2.500 7.500 5.500 0 2-1.500 3-3.500 3H12l-2 3.500-1.500-3.500C5 17 2 17.500 2 16z" fill="#e2452f" '+S1+' stroke-width="1.5"/><circle cx="15.500" cy="12" r="1.500" fill="'+K+'"/>';
AI.lift='<path d="M2 5l20-3" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12 3.500V8" stroke="currentColor" stroke-width="2.4"/><rect x="5" y="8" width="14" height="12" rx="3" fill="currentColor"/>';
AI.spin='<path d="M19 12a7 7 0 1 1-2.500-5.400" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M21.500 3l-1.500 6.500-5.500-2.500z" fill="currentColor"/>';
AI.flame='<path d="M13 2c0 4 6 6 6 13a7 7 0 0 1-14 0c0-3 2-5 3-8 1 2 2 3 3 3 1-2 2-5 2-8z" fill="currentColor"/>';

QI.egg='<path d="M12 2.500c4 0 7 6 7 10.800a7 7 0 0 1-14 0C5 8.500 8 2.500 12 2.500z" fill="#ffd23f" '+S1+' stroke-width="1.6"/><path d="M9 9.500c.500-1.800 1.500-3 2.800-3.600" stroke="#fff" stroke-width="1.800" stroke-linecap="round" fill="none"/>';
QI.map='<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z" fill="#bfe6a8" '+S1+' stroke-width="1.6"/><path d="M9 4v14M15 6v14" '+S1+' stroke-width="1.4"/><circle cx="12" cy="10.500" r="2" fill="#e63946" '+S1+' stroke-width="1"/>';
IC.balloon='<path d="M12 2a7.5 7.5 0 0 0-7.5 7.5c0 3.6 3 6 5.2 8h4.6c2.2-2 5.2-4.4 5.2-8A7.5 7.5 0 0 0 12 2z" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 2c-2 2-2.8 4.8-2.8 7.5 0 3.200 1 6 .5 8M12 2c2 2 2.800 4.800 2.800 7.500 0 3.200-1 6-.5 8" fill="#ffd23f" '+S1+' stroke-width="1.2"/><rect x="9" y="19" width="6" height="3.5" rx="1" fill="#a0632f" '+S1+' stroke-width="1.3"/>';
IC.heli='<path d="M3 4.5h18M12 4.5v3" '+S1+' stroke-width="2.2"/><path d="M4 14c0-3.5 3-6.5 7.5-6.5S19 10 19 13.5V16H6.5C5 16 4 15.2 4 14z" fill="#58b548" '+S1+' stroke-width="1.5"/><path d="M13 9.5c2.5 0 4 1.500 4 3.500h-4z" fill="#bfe9f5" '+S1+' stroke-width="1.2"/><path d="M4.500 12H1.500M1.5 9.5v5M8 16v3.5M15 16v3.5M5.5 19.5h12" '+S1+' stroke-width="1.8"/>';
IC.boat='<path d="M12 2v14" '+S1+' stroke-width="1.8"/><path d="M12.8 3c3.500 2.500 6 6.500 6.500 11H12.800z" fill="#fff8e6" '+S1+' stroke-width="1.4"/><path d="M11.2 6c-2.500 2-4 4.500-4.500 8h4.500z" fill="#e63946" '+S1+' stroke-width="1.4"/><path d="M2.5 16h19l-3 5.5H5.5z" fill="#a0632f" '+S1+' stroke-width="1.6"/>';
IC.bug='<path d="M5 10L1.5 7.5M5 14H1.5M5.5 17.5L2 20M19 10l3.5-2.5M19 14h3.5M18.5 17.5L22 20" '+S1+' stroke-width="1.8"/><ellipse cx="12" cy="14" rx="7.5" ry="7" fill="#e63946" '+S1+' stroke-width="1.5"/><path d="M12 7v14" '+S1+' stroke-width="1.4"/><circle cx="9" cy="12" r="1.4" fill="'+K+'"/><circle cx="15" cy="16" r="1.4" fill="'+K+'"/><circle cx="12" cy="5" r="3" fill="#bfe9f5" '+S1+' stroke-width="1.4"/>';
IC.rope='<path d="M2 4l20 9" '+S1+' stroke-width="2"/><rect x="1" y="2" width="3" height="20" rx="1" fill="#a0632f" '+S1+' stroke-width="1.2"/><rect x="20" y="11" width="3" height="11" rx="1" fill="#a0632f" '+S1+' stroke-width="1.2"/><path d="M12 8.5v4" '+S1+' stroke-width="1.8"/><circle cx="12" cy="15.5" r="3" fill="#ffd2a8" '+S1+' stroke-width="1.3"/>';
IC.sub='<path d="M9 9V5.500h4" fill="none" '+S1+' stroke-width="2"/><rect x="2" y="9" width="18" height="10" rx="5" fill="#ffc21a" '+S1+' stroke-width="1.6"/><circle cx="13" cy="14" r="2.400" fill="#bfe9f5" '+S1+' stroke-width="1.3"/><circle cx="7" cy="14" r="1.500" fill="#bfe9f5" '+S1+' stroke-width="1.1"/><path d="M21.500 10.500v7" '+S1+' stroke-width="2.4"/>';
AI.hook='<path d="M12 2v9" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/><path d="M12 11a4.500 4.500 0 1 1-4.500 4.500" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M5 13.500l2.500 2 2-2.500" stroke="currentColor" stroke-width="2.400" fill="none" stroke-linecap="round" stroke-linejoin="round"/>';
AI.horn='<path d="M3 9h4l8-5v16l-8-5H3z" fill="currentColor"/><path d="M18 8.5a5 5 0 0 1 0 7M20.500 6a8.500 8.500 0 0 1 0 12" stroke="currentColor" stroke-width="2.2" fill="none" stroke-linecap="round"/>';
AI.scope='<path d="M3 13l13-7 3 5-13 7z" fill="currentColor"/><path d="M10 15l-3 7M10 15l3 7" stroke="currentColor" stroke-width="2.400" stroke-linecap="round"/><circle cx="20" cy="5" r="1.600" fill="currentColor"/>';
AI.bow='<path d="M5 3c9 1.500 14 6.500 16 16" stroke="currentColor" stroke-width="2.800" fill="none" stroke-linecap="round"/><path d="M5 3l16 16M2 12h13" stroke="currentColor" stroke-width="1.800" stroke-linecap="round"/><path d="M15 9l5 3-5 3z" fill="currentColor"/>';
AI.sonar='<circle cx="12" cy="12" r="2.600" fill="currentColor"/><path d="M6.500 6.500a8 8 0 0 0 0 11M17.500 6.500a8 8 0 0 1 0 11M3.500 3.500a12 12 0 0 0 0 17M20.500 3.500a12 12 0 0 1 0 17" stroke="currentColor" stroke-width="2.200" fill="none" stroke-linecap="round"/>';
