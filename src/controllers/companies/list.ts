import { FastifyReply, FastifyRequest } from "fastify";
import pool from "@/config/database";
import { z } from 'zod'

export const listCompaniesSchema = {
  response: {
    200: z.object({
      companies: z.array(z.object({
        id: z.string().uuid(),
        name: z.string(),
        email: z.string(),
        cnpj: z.string(),
        phone: z.string(),
        website: z.string().nullable(),
        products_xml_url: z.string().nullable(),
        created_at: z.string().datetime(),
      }))
    }),
    500: z.object({
      error: z.string(),
      message: z.string(),
    })
  }
}

export async function listCompanies(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  const client = await pool.connect()
  try {
    const { rows: companies } = await client.query(
      'SELECT id, name, email, cnpj, phone, website, products_xml_url, created_at FROM companies ORDER BY created_at DESC'
    )

    return reply.status(200).send({ 
      companies: companies.map(company => ({
        ...company,
        created_at: new Date(company.created_at).toISOString()
      }))
    })
  } catch (error) {
    console.error('Error listing companies:', error)
    return reply.status(500).send({
      error: "Internal Server Error",
      message: "Failed to list companies"
    })
  } finally {
    client.release()
  }
}