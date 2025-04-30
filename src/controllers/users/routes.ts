import { FastifyInstance } from "fastify"
import { createUser, createUserSchema } from '@/controllers/users/create-user'
import { listUsers, listUsersSchema } from '@/controllers/users/list-users'
import { authenticate, authenticateSchema } from "./authenticate"
import { verifyJwt } from "../middlewares/verify-jwt"
// import { verifyUserRole } from "../middlewares/verify-user-role"
import { deleteAllUsers, deleteAllUsersSchema } from "./delete-all-users"

export async function usersRoutes(app: FastifyInstance): Promise<void> {
  app.get('', {
    schema: {
      tags: ['users'],
      description: 'List users',
      ...listUsersSchema
    },
    onRequest: [verifyJwt]
  }, listUsers)

  app.post('', {
    schema: {
      tags: ['users'],
      description: 'Create a new users',
      ...createUserSchema
    }
  }, createUser)

  app.post('/sessions', {
    schema: {
      tags: ['sessions'],
      description: 'Authenticate user',
      ...authenticateSchema
    },
    handler: authenticate
  })

  app.delete('/all', {
    schema: {
      tags: ['users'],
      description: 'Delete all users (admin only)',
      ...deleteAllUsersSchema
    },
    onRequest: [verifyJwt]
    // onRequest: [verifyJwt, verifyUserRole('admin')]
  }, deleteAllUsers)
}