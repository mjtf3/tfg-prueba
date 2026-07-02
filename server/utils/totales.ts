/** Totales acumulados de una recolección a partir de sus palés (RF-04, RF-11). */
export function resumenRecoleccion(pales: Array<{ numCajas: number; kilos: string }>) {
  return {
    totalCajas: pales.reduce((suma, p) => suma + p.numCajas, 0),
    totalKilos: pales.reduce((suma, p) => suma + Number(p.kilos), 0),
  }
}
