declare module '@adonisjs/core/http' {
  interface Request {
    user: {
      id: string
      email: string
      role: 'admin' | 'client' | 'cook' | 'delivery'
    }
  }
}
