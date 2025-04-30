import { FastifyRequest, FastifyReply } from 'fastify'

export async function verifyApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const token = request.headers['x-api-key']
  const expectedToken = process.env.API_SECRET_KEY

  if (token !== expectedToken) {
    return reply.status(401).send({ error: 'Unauthorized request' })
  }
}
