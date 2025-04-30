import z from 'zod'
import { FastifyInstance } from "fastify"
// import { randomUUID } from 'crypto'
import { createUser } from './controllers/users/create-user'

interface User {
  id: string
  name: string
  email: string
}

const users: User[] = []

export async function routes(app: FastifyInstance): Promise<void> {
  app.get('/users', {
    schema: {
      tags: ['users'],
      description: 'List users',
      response: {
        200: z.array(z.object({
          id: z.string(),
          name: z.string(),
          email: z.string(),
        }))
      }
    }
  }, () => {
    return users
  })

  app.post('/users', {
    schema: {
      tags: ['users'],
      description: 'Create a new users',
      body: z.object({
        name: z.string(),
        email: z.string().email(),
      }),
      response: {
        201: z.null().describe('User created'),
      }
    }
  }, createUser)
}