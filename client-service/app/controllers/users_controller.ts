import type { HttpContext } from '@adonisjs/core/http'
import { supabase } from '#start/supabase'

export default class UsersController {
  public async me({ request }: HttpContext) {
    const user = request.user

    if (!user || !user.id) {
      throw new Error('[USER] No authenticated user')
    }

    const { data, error } = await supabase
      .from('profiles')
      .select(`
        id,
        role,
        first_name,
        last_name,
        phone_number,
        birthdate,
        created_at
      `)
      .eq('id', user.id)
      .single()

    if (error) {
      throw new Error(`[USER] Failed to fetch profile: ${error.message}`)
    }

    return {
      id: data.id,
      role: data.role,
      first_name: data.first_name,
      last_name: data.last_name,
      phone_number: data.phone_number,
      birthdate: data.birthdate,
      created_at: data.created_at,
    }
  }
}