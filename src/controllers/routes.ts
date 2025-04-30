import { FastifyInstance } from "fastify"

export async function appRoutes(app: FastifyInstance): Promise<void> {
  app.get('', () => {
    return {
      message: 'Hello World'
    }
  })
}