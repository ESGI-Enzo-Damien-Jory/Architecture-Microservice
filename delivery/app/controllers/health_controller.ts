import { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import env from '#start/env'

export default class HealthController {
  async index({ response, logger }: HttpContext) {
    const startTime = Date.now()
    logger.info('[HEALTH] Health check started')
    
    try {
      logger.info('[HEALTH] Testing database connection')
      await db.rawQuery('SELECT 1')
      logger.info('[HEALTH] Database connection successful')
      
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      logger.info(`[HEALTH] Auth service configured: ${authServiceUrl}`)
      
      const duration = Date.now() - startTime
      logger.info(`[HEALTH] Health check completed successfully (${duration}ms)`)
      
      return response.ok({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        authService: authServiceUrl ? 'configured' : 'not configured',
        uptime: process.uptime(),
        version: '1.0.0'
      })
    } catch (error) {
      const duration = Date.now() - startTime
      logger.error(`[HEALTH] Health check failed (${duration}ms)`, error)
      
      return response.status(503).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Database connection failed',
        uptime: process.uptime()
      })
    }
  }
}