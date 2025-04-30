import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const createUserSchema = {
  body: z.object({
    name: z.string().max(255),
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
  }),
  response: {
    201: z.object({
      user: z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string(),
        created_at: z.string().datetime(),
      })
    }),
    400: z.object({
      error: z.string(),
      message: z.string(),
      details: z.array(z.any()).optional(),
    }),
    409: z.object({
      error: z.string(),
      message: z.string(),
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    })
  }
}

export async function createUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const {
    name,
    email,
    password,
  } = createUserSchema.body.parse(request.body)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check email existence within the same transaction
    const { rows: [emailCheck] } = await client.query(
      "SELECT EXISTS(SELECT 1 FROM users WHERE email = $1) as exists", 
      [email]
    )

    if (emailCheck.exists) {
      await client.query('ROLLBACK')
      return reply.status(409).send({ 
        error: "Conflict",
        message: "User with this email already exists" 
      })
    }

    const password_hash = await bcrypt.hash(password, 6)

    const { rows: [newUser] } = await client.query(
      'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at',
      [name, email, password_hash]
    )

    await client.query('COMMIT')

    return reply.status(201).send({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        created_at: new Date(newUser.created_at).toISOString()
      }
    })

  } catch (error) {
    await client.query('ROLLBACK')
    
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid input data",
        details: error.errors
      })
    }

    console.error('Error creating user:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to create user"
    })
  } finally {
    client.release()
  }
}