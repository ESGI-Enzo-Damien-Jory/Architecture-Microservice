/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| Define HTTP routes for your API using grouped prefixes and middleware.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

// Lazy-loaded controllers
const AuthController = () => import('#controllers/auth_controller')
const UserController = () => import('#controllers/users_controller')
/*
|--------------------------------------------------------------------------
| Auth Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.post('login', [AuthController, 'login'])
    router.post('register', [AuthController, 'register'])
    router.post('logout', [AuthController, 'logout']).use(middleware.supabaseAuth())
  })
  .prefix('/api/auth')

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('me', [UserController, 'me'])  
  })
  .prefix('/api/user')
  .use(middleware.supabaseAuth())