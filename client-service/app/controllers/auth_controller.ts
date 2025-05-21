import type { HttpContext } from '@adonisjs/core/http'
import { supabase } from '#start/supabase'

export default class AuthController {
  public async login({ request, response, logger }: HttpContext) {
    const { email, password } = request.only(['email', 'password'])
    logger.info(`[AUTH] Login attempt for ${email}`)
    logger.info('[AUTH] Incoming login request body:', request.all())

    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      logger.warn(`[AUTH] Login failed for ${email}: ${error.message}`)
      return response.unauthorized({ error: error.message })
    }

    logger.info(`[AUTH] Login successful for ${email}`)
    return { token: data.session?.access_token, user: data.user }
  }

  public async logout({ response, logger }: HttpContext) {
    const { error } = await supabase.auth.signOut()

    if (error) {
      logger.error(`[AUTH] Logout failed: ${error.message}`)
      return response.internalServerError({ error: error.message })
    }

    logger.info('[AUTH] Logout successful')
    return { message: 'Logged out' }
  }

  public async register({ request, response, logger }: HttpContext) {
    const { email, password, first_name, last_name, phone_number, birthdate } = request.only([
      'email',
      'password',
      'first_name',
      'last_name',
      'phone_number',
      'birthdate',
    ])

    logger.info(`[AUTH] Registration attempt for ${email}`)

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      logger.warn(`[AUTH] Registration failed for ${email}: ${authError.message}`)
      return response.badRequest({ error: authError.message })
    }

    const userId = authData.user?.id
    if (!userId) {
      logger.error(`[AUTH] Registration failed: No user ID returned`)
      return response.internalServerError({ error: 'User ID not returned' })
    }

    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      role: 'client',
      first_name,
      last_name,
      phone_number,
      birthdate,
    })

    if (profileError) {
      logger.error(`[AUTH] Failed to create profile for ${userId}: ${profileError.message}`)
      return response.internalServerError({ error: profileError.message })
    }

    logger.info(`[AUTH] Registration successful for ${email}`)
    return {
      message: 'Registration successful. Check your email to confirm your account.',
      user: authData.user,
    }
  }
}
