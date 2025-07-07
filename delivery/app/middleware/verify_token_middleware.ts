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

      const { data } = await axios.post(verifyUrl, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!data || !data.user) {
        logger.warn('[AUTH] /verify did not return a valid user')
        return response.unauthorized({ error: 'Unauthorized: invalid token' })
      }

      request.user = data.user

      logger.info(`[AUTH] Authenticated user: ${data.user.email ?? data.user.id}`)

      await next()
    } catch (error: any) {
      logger.error(`[AUTH] Token verification failed: ${error.message}`)
      return response.unauthorized({ error: 'Invalid or expired token' })
    }
  }
}