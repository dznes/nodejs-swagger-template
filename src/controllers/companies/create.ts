import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import { z } from 'zod'

export const createCompanieschema = {
  body: z.object({
    name: z.string().max(255),
    email: z.string().email().max(255),
    cnpj: z.string().max(14),
    phone: z.string().max(20),
    website: z.string().url().max(255).optional(),
    products_xml_url: z.string().url().max(255).optional(),
  }),
  response: {
    201: z.object({
      company: z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string(),
        cnpj: z.string(),
        phone: z.string(),
        website: z.string().nullable(),
        products_xml_url: z.string().nullable(),
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

export async function createCompany(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const {
    name,
    email,
    cnpj,
    phone,
    website,
    products_xml_url,
  } = createCompanieschema.body.parse(request.body)

  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Check email existence within the same transaction
    const { rows: [emailCheck] } = await client.query(
      "SELECT EXISTS(SELECT 1 FROM companies WHERE email = $1) as exists", 
      [email]
    )

    if (emailCheck.exists) {
      await client.query('ROLLBACK')
      return reply.status(409).send({ 
        error: "Conflict",
        message: "Company with this email already exists" 
      })
    }

    const { rows: [newCompany] } = await client.query(
      'INSERT INTO companies (name, email, cnpj, phone, website, products_xml_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, email, cnpj, phone, website, products_xml_url, created_at',
      [name, email, cnpj, phone, website, products_xml_url]
    )

    await client.query('COMMIT')

    return reply.status(201).send({
      company: {
        id: newCompany.id,
        name: newCompany.name,
        email: newCompany.email,
        cnpj: newCompany.cnpj,
        phone: newCompany.phone,
        website: newCompany.website,
        products_xml_url: newCompany.products_xml_url,
        created_at: new Date(newCompany.created_at).toISOString()
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

    console.error('Error creating company:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to create company"
    })
  } finally {
    client.release()
  }
}