import type { HttpContext } from '@adonisjs/core/http'
import { supabase } from '#start/supabase'

export default class HealthController {
  public async check({ response, logger }: HttpContext) {
    try {
      const { error } = await supabase
        .from('dishes')
        .select('id', { count: 'exact', head: true })

      if (error) {
        logger.error('[HEALTH] Supabase connection failed:', error.message)
        return response.status(503).send({ status: 'error', service: 'supabase', error: error.message })
      }

      return response.ok({ status: 'ok'})
    } catch (err) {
      logger.fatal('[HEALTH] Unexpected failure:', err)
      return response.status(500).send({ status: 'error', error: 'Unexpected server error' })
    }
  }
}
