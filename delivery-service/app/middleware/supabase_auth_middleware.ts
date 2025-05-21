import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import { supabase } from '#start/supabase'

export default class SupabaseAuthMiddleware {
  async handle({ request, response, logger }: HttpContext, next: NextFn) {
    const authHeader = request.header('Authorization')
    const token = authHeader?.replace('Bearer ', '')

    if (!token) {
      logger.warn('[AUTH] Missing Authorization token')
      return response.unauthorized({ error: 'Missing Authorization token' })
    }

    const { data: authData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !authData?.user) {
      logger.warn(`[AUTH] Invalid or expired token. Reason: ${authError?.message ?? 'No user returned'}`)
      return response.unauthorized({ error: 'Invalid or expired token' })
    }

    const user = authData.user
    const userId = user.id
    request.user = user

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single()

    if (profileError || !profileData) {
      logger.warn(`[AUTH] Unable to fetch user profile. Reason: ${profileError?.message ?? 'Not found'}`)
      return response.forbidden({ error: 'Profile not found or inaccessible' })
    }

    if (profileData.role !== 'delivery') {
      logger.warn(`[AUTH] Forbidden: user ${user.email} is not a delivery person`)
      return response.forbidden({ error: 'Access denied: delivery role required' })
    }

    logger.info(`[AUTH] Delivery access granted to user: ${user.email}`)
    await next()
  }
}