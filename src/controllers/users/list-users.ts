import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import { z } from 'zod'

export const listUsersSchema = {
  response: {
    200: z.object({
      users: z.array(z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string(),
      }))
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    })
  }
}

export async function listUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const client = await pool.connect()
  try {
    const { rows: users } = await client.query(
      'SELECT id, name, email FROM users ORDER BY created_at DESC'
    )

    return reply.status(200).send({ users })
  } catch (error) {
    console.error('Error listing users:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to list users"
    })
  } finally {
    client.release()
  }
}