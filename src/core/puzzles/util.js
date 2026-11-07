// Hilfen für die Rätselgeneratoren. Bewegt aus legacy.js (PR 5).

/** 0, 1, …, n-1. @param {number} n @returns {number[]} */
export function idxs(n){ const a=[]; for(let i=0;i<n;i++) a.push(i); return a; }
