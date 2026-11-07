// Welt-Felder: die Zellen und die Spaltenwerte der Welt als Typed Arrays mit fester Größe. Bewegt aus legacy.js (PR 7a).
// Die Bindungen sind const und werden nie neu zugewiesen; geschrieben wird nur über den Index (Weltgenerierung, Zellautomat, Graben, Laden).
// Gefüllt werden sie weiter in legacy.js, in derselben Reihenfolge wie vorher. Neu zugewiesene Welt-Namen (BIO, STR, rx0 …) folgen in PR 7b.
import { GX, GY, SW } from '../core/world/const.js';

/** Bodenhöhe je Spalte (Pixel), mit einem Rand rechts für die Interpolation in ground(). */
export const g0=new Float32Array(GX+2);
/** Zelltyp je Zelle (Zeile mal GX plus Spalte) und Stempel für den sichtbaren Ausschnitt. */
export const grid=new Uint8Array(GX*GY), stamp=new Uint8Array(SW*GY);
/* Brenndauer nur für Feuerzellen (höchstens MAX_FIRE). Früher ein Byte für jede der 39 Mio. Zellen (39 MB); auf Handys hat Firefox das Spiel wegen Speichermangel beendet.
   255 = brennt dauerhaft (Lagerfeuer). Fehlt eine Zelle, ist ihr Wert 0. Einträge für Zellen, die längst kein Feuer mehr sind, räumt lifeS gelegentlich weg. */
/** @type {Map<number, number>} */
export const LIFE=new Map();
/** Harte Schichten und Zonen in der Tiefe: Oberkante je Spalte (Zellen). */
export const zS1=new Int16Array(GX), z4=new Int16Array(GX), zS2=new Int16Array(GX), zS3=new Int16Array(GX);
/** Alter Boden (grow0) und Schichtgrenzen je Spalte (Zellen). */
export const grow0=new Int16Array(GX), rA=new Int16Array(GX), rB=new Int16Array(GX), rD=new Int16Array(GX), rH=new Int16Array(GX), rC=new Int16Array(GX);
/** Oberkante des Schneebergs je Spalte (Zellen). */
export const mtop=new Int16Array(GX);
/** Länder je Spalte: Land, zweites Land, Mischung, Index, keine Höhle, Flüssigkeit und ihre Höhe. */
export const bio=new Uint8Array(GX), bio2=new Uint8Array(GX), bmx=new Uint8Array(GX), bix=new Uint8Array(GX), noCave=new Uint8Array(GX), liqM=new Uint8Array(GX), liqY=new Int16Array(GX);