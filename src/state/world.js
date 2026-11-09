// Welt-Felder: die Zellen und die Spaltenwerte der Welt als Typed Arrays mit fester Größe. Bewegt aus legacy.js (PR 7a).
// Die Bindungen sind const und werden nie neu zugewiesen; geschrieben wird nur über den Index (Weltgenerierung, Zellautomat, Graben, Laden).
// Gefüllt werden sie weiter in app/wire.js, in derselben Reihenfolge wie vorher.
// Darunter die neu zugewiesenen Welt-Namen (PR 7b): export let mit je einem Setter. app/wire.js liest und schreibt sie über die Fassade ST (state/facade.js).
// genF und winC bleiben vorerst in app/wire.js: Sie werden in heißen Schleifen gelesen (step, Nebel), dort keine Getter (ADR 0001 Punkt 9).
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

// Neu zugewiesene Welt-Namen, bewegt aus legacy.js (PR 7b). Werte und Reihenfolge wie vorher.
/** Länder der Welt, nach Spalten geordnet. @type {any[]} */
export let BIO=[];
/** Bauwerke, die nach und nach gebaut werden (stI). @type {any[]} */
export let STR=[];
/** Tiere und Wesen. @type {any[]} */
export let CRE=[];
/** Dinge zum Aufsammeln. @type {any[]} */
export let PICKS=[];
/** Sprungpilze und Heuballen. @type {any[]} */
export let PADS=[];
/** Deko: Mast, Mühle, Schilder … @type {any[]} */
export let DECO=[];
/** Versteckte Eier. @type {any[]} */
export let EGGS=[];
/** Schätze. @type {any[]} */
export let LOOT=[];
/** Was Tiere fallen lassen. @type {any[]} */
export let DROPS=[];
/** Nächstes Bauwerk in STR, das noch gebaut werden muss. */
export let stI=0;
/** Anzahl Bäume nach der Erzeugung. */
export let NT0=0;
/** Anzahl Wolken nach der Erzeugung. */
export let NC0=0;
/** Schon gesehene Dinge je Schlüssel. @type {Record<string, any>} */
export let seen={};
/** Gefundene Eier je Schlüssel. @type {Record<string, any>} */
export let eggGot={};
/** Gefundene Schätze je Schlüssel. @type {Record<string, any>} */
export let lootGot={};
/** Gefundene Kugeln je Schlüssel. @type {Record<string, any>} */
export let orbGot={};

// Setter: Ein importierter Name kann nicht zugewiesen werden. Nur die Fassade ruft sie auf.
/** @param {any[]} v */ export function setBIO(v){ BIO=v; }
/** @param {any[]} v */ export function setSTR(v){ STR=v; }
/** @param {any[]} v */ export function setCRE(v){ CRE=v; }
/** @param {any[]} v */ export function setPICKS(v){ PICKS=v; }
/** @param {any[]} v */ export function setPADS(v){ PADS=v; }
/** @param {any[]} v */ export function setDECO(v){ DECO=v; }
/** @param {any[]} v */ export function setEGGS(v){ EGGS=v; }
/** @param {any[]} v */ export function setLOOT(v){ LOOT=v; }
/** @param {any[]} v */ export function setDROPS(v){ DROPS=v; }
/** @param {number} v */ export function setStI(v){ stI=v; }
/** @param {number} v */ export function setNT0(v){ NT0=v; }
/** @param {number} v */ export function setNC0(v){ NC0=v; }
/** @param {Record<string, any>} v */ export function setSeen(v){ seen=v; }
/** @param {Record<string, any>} v */ export function setEggGot(v){ eggGot=v; }
/** @param {Record<string, any>} v */ export function setLootGot(v){ lootGot=v; }
/** @param {Record<string, any>} v */ export function setOrbGot(v){ orbGot=v; }
