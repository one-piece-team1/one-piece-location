import { Logger } from '@nestjs/common';
import { LineString } from 'geojson';

/**
 * @description Check Memory Info
 * @public
 * @param {string} memName
 * @returns {void}
 */
export function memInfo(memName: string): void {
  Logger.log(`Function ${memName} used memory: ${Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100} MB`, 'Memory-Info', true);
}

/**
 * @description Check if is Json string
 * @public
 * @param {string} str
 * @returns {boolean}
 */
export function isJsonString(str: string): boolean {
  try {
    const json = JSON.parse(str);
    return typeof json === 'object';
  } catch (error) {
    return false;
  }
}

/**
 * @description Add Month by Date
 * @public
 * @param {Date} date
 * @param {number} months
 * @returns {Date}
 */
export function addMonths(date: Date, months: number) {
  const d = date.getDate();
  date.setMonth(date.getMonth() + +months);
  if (date.getDate() !== d) {
    date.setDate(0);
  }
  return date;
}

/**
 * @description Check if is empty object
 * @public
 * @param {{ [key: string]: any; }} obj
 * @returns {boolean}
 */
export function isEmptyObj(obj: { [key: string]: any }): boolean {
  for (const property in obj) {
    // following es-lint rule no-prototype-builtins, do not access object prototype directly
    if (Object.prototype.hasOwnProperty.call(obj, property)) return false;
  }
  return true;
}

/**
 * @description Convert coordinates string like to Linestring
 * @public
 * @param {string} coordinates
 * @returns {LineString}
 */
export function coordinatesStringToLineString(coordinates: string): LineString {
  const tempArr: string[] = coordinates.split(',');
  const coords: number[][] = [];
  for (let i = 0; i < tempArr.length; i += 2) {
    /**
     * @Important First element of the array is lontitude, and second of array is latitude
     */
    coords.push([Number(tempArr[i]), Number(tempArr[i + 1])]);
  }
  return {
    type: 'LineString',
    coordinates: coords,
  };
}
