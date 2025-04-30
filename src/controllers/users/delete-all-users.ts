import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import { z } from 'zod'

export const deleteAllUsersSchema = {
  response: {
    200: z.object({
      message: z.string(),
      deletedCount: z.number()
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    })
  }
}

export async function deleteAllUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const client = await pool.connect()
  try {
    const { rowCount } = await client.query('DELETE FROM users')
    
    return reply.status(200).send({
      message: "All users deleted successfully",
      deletedCount: rowCount
    })
  } catch (error) {
    console.error('Error deleting users:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to delete users"
    })
  } finally {
    client.release()
  }
} 