// delivery/app/middleware/verify_token_middleware.ts
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import env from '#start/env'
import axios from 'axios'

export default class VerifyTokenMiddleware {
  async handle({ request, response, logger }: HttpContext, next: NextFn) {
    const authHeader = request.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('[AUTH] Missing or invalid Authorization header')
      return response.unauthorized({ error: 'Missing or invalid Authorization header' })
    }

    const token = authHeader.replace('Bearer ', '')

    try {
      const authServiceUrl = env.get('AUTH_SERVICE_URL')
      const verifyUrl = `${authServiceUrl}/verify`

      logger.info(`[AUTH] Verifying token with: ${verifyUrl}`)

      const { data } = await axios.post(verifyUrl, {}, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000 // 10 second timeout
      })

      if (!data || !data.valid || !data.user) {
        logger.warn('[AUTH] Auth service returned invalid response:', data)
        return response.unauthorized({ error: 'Invalid token response' })
      }

      // Add user to request for easy access
      request.user = {
        id: data.user.id,
        email: data.user.email || '',
        role: data.user.role
      }

      logger.info(`[AUTH] Authenticated user: ${data.user.id} with role: ${data.user.role}`)

      await next()
    } catch (error: any) {
      logger.error(`[AUTH] Token verification failed:`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data
      })
      
      // More specific error handling
      if (error.response?.status === 401) {
        return response.unauthorized({ error: 'Invalid or expired token' })
      }
      
      return response.status(503).json({ error: 'Authentication service unavailable' })
    }
  }
}