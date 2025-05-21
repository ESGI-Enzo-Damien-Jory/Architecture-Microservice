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
const HealthController = () => import('#controllers/health_controller')
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
  .prefix('/user/auth')

/*
|--------------------------------------------------------------------------
| User Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('me', [UserController, 'me'])  
  })
  .prefix('/user')
  .use(middleware.supabaseAuth())

/*
|--------------------------------------------------------------------------
| Health Routes
|--------------------------------------------------------------------------
*/
router
  .group(() => {
    router.get('health', [HealthController, 'check'])  
  })
  .prefix('/user')
