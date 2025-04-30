import { describe, it, expect, beforeEach } from 'vitest'
import { createUser } from './create-user.js'
import { FastifyRequest, FastifyReply } from 'fastify'
import { faker } from '@faker-js/faker'

describe('Create User Controller', () => {
  let mockRequest: Partial<FastifyRequest>
  let mockReply: Partial<FastifyReply>
  let sentData: Record<string, string>
  let statusCode: number

  beforeEach(() => {
    // Reset mocks before each test
    mockRequest = {
      body: {}
    }

    mockReply = {
      status: (code: number) => {
        statusCode = code
        return mockReply as FastifyReply
      },
      send: (data: Record<string, string>) => {
        sentData = data
        return mockReply as FastifyReply
      }
    }
  })

  it('should create a user with valid data', async () => {
    const userData = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
    }
    
    mockRequest.body = userData

    await createUser(
      mockRequest as FastifyRequest,
      mockReply as FastifyReply
    )

    expect(statusCode).toBe(201)
    expect(sentData).toEqual(userData)
  })

  it('should reject invalid email', async () => {
    const userData = {
      name: faker.person.fullName(),
      email: 'invalid-email',
    }
    
    mockRequest.body = userData

    await expect(
      createUser(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      )
    ).rejects.toThrow()
  })

  it('should reject missing required fields', async () => {
    const userData = {
      name: faker.person.fullName(),
      // missing email field
    }
    
    mockRequest.body = userData

    await expect(
      createUser(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      )
    ).rejects.toThrow()
  })
}) 