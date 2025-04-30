import { FastifyReply, FastifyRequest } from "fastify";
import { z } from 'zod'

export async function createUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const createUserSchema = z.object({
    name: z.string(),
    email: z.string().email(),
  })

  const {
    name,
    email,
  } = createUserSchema.parse(request.body)

  return reply.status(201).send(
    {
      name,
      email,
    }
  )

}