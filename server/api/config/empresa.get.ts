import env from '../../utils/env'
import { requireRole } from '../../utils/require-auth'

/** Datos regulatorios fijos de la empresa (RGSEAA / GGN) para prerrellenar la
 * etiqueta externa al crear un lote. Solo oficina, que es quien da de alta lotes. */
export default defineEventHandler(async (event) => {
  await requireRole(event, 'oficina')
  return {
    rgseaa: env.EMPRESA_RGSEAA ?? '',
    ggn: env.EMPRESA_GGN ?? '',
  }
})
