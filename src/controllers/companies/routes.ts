import { FastifyInstance } from "fastify"
import { createCompany, createCompanieschema } from '@/controllers/companies/create'
import { listCompanies, listCompaniesSchema } from '@/controllers/companies/list'
import { verifyJwt } from "../middlewares/verify-jwt"
import { deleteAllCompanies, deleteAllCompaniesSchema } from "./delete-all"

export async function companiesRoutes(app: FastifyInstance): Promise<void> {
  app.get('', {
    schema: {
      tags: ['companies'],
      description: 'List companies',
      ...listCompaniesSchema
    },
    onRequest: [verifyJwt]
  }, listCompanies)

  app.post('', {
    schema: {
      tags: ['companies'],
      description: 'Create a new companies',
      ...createCompanieschema
    }
  }, createCompany)

  app.delete('/all', {
    schema: {
      tags: ['companies'],
      description: 'Delete all companies (admin only)',
      ...deleteAllCompaniesSchema
    },
    onRequest: [verifyJwt]
  }, deleteAllCompanies)
}