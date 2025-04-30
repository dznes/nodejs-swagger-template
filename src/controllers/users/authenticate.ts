import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { checkRateLimit, incrementFailedAttempt, resetAttempts } from '@/services/rate-limit';

export const authenticateSchema = {
  body: z.object({
    email: z.string().email().max(255),
    password: z.string().min(8).max(255),
  }),
  response: {
    200: z.object({
      token: z.string(),
      user: z.object({
        id: z.string(),
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
    401: z.object({
      error: z.string(),
      message: z.string(),
      remainingAttempts: z.number().optional(),
      timeToUnblock: z.number().optional(),
    }),
    429: z.object({
      error: z.string(),
      message: z.string(),
      timeToUnblock: z.number(),
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    })
  }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const {
    email,
    password,
  } = authenticateSchema.body.parse(request.body)

  // Check rate limit before proceeding
  const rateLimit = await checkRateLimit(email);
  if (rateLimit.isBlocked) {
    return reply.status(429).send({
      error: "Too Many Attempts",
      message: "Account temporarily blocked due to too many failed attempts",
      timeToUnblock: rateLimit.timeToUnblock
    });
  }

  const client = await pool.connect()
  try {
    // Find user by email
    const { rows: [user] } = await client.query(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
      [email]
    )

    if (!user) {
      await incrementFailedAttempt(email);
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid email or password",
        remainingAttempts: rateLimit.remainingAttempts - 1
      })
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash)
    if (!isPasswordValid) {
      await incrementFailedAttempt(email);
      return reply.status(401).send({
        error: "Unauthorized",
        message: "Invalid email or password",
        remainingAttempts: rateLimit.remainingAttempts - 1
      })
    }

    const token = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id } },
    )
    const refreshToken = await reply.jwtSign(
      { role: user.role },
      { sign: { sub: user.id, expiresIn: '7d' } },
    )



    // Reset attempts on successful login
    await resetAttempts(email);

    return reply
    .setCookie('refreshToken', refreshToken, {
      path: '/',
      secure: true,
      sameSite: true,
      httpOnly: true,
    })
    .status(200)
    .send({ 
        token,
        user: {
        id: user.id,
        name: user.name,
        email: user.email,
        created_at: new Date(user.created_at).toISOString()
      } 
    })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.status(400).send({
        error: "Validation Error",
        message: "Invalid input data",
        details: error.errors
      })
    }

    console.error('Error authenticating user:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to authenticate user"
    })
  } finally {
    client.release()
  }
} 