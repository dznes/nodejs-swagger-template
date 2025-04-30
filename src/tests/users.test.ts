import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { faker } from '@faker-js/faker'
import { app } from '../app'
import pool from '../config/database'
import bcrypt from 'bcryptjs'

describe('User Routes', () => {
  const testUser = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'TestPassword123!'
  }

  const adminUser = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    password: 'TestPassword123!'
  }

  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await pool.end()
  })

  beforeEach(async () => {
    // Clean up the database before each test
    await pool.query('DELETE FROM users')
  })

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: testUser
      })

      expect(response.statusCode).toBe(201)
      const body = JSON.parse(response.payload)
      expect(body.user).toHaveProperty('id')
      expect(body.user.name).toBe(testUser.name)
      expect(body.user.email).toBe(testUser.email)
      expect(body.user).toHaveProperty('created_at')
    })

    it('should not create a user with existing email', async () => {
      // First create a user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: testUser
      })

      // Try to create another user with the same email
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          ...testUser,
          name: faker.person.fullName()
        }
      })

      expect(response.statusCode).toBe(409)
      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Conflict')
      expect(body.message).toBe('User with this email already exists')
    })

    it('should validate input data', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: {
          name: testUser.name,
          email: 'invalid-email',
          password: 'short'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Bad Request')
    })
  })

  describe('POST /api/users/sessions', () => {
    it('should authenticate a user with valid credentials', async () => {
      // First create a user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: testUser
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/sessions',
        payload: {
          email: testUser.email,
          password: testUser.password
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body).toHaveProperty('token')
      expect(body.user.email).toBe(testUser.email)
      expect(response.cookies).toHaveLength(1)
      expect(response.cookies[0].name).toBe('refreshToken')
    })

    it('should not authenticate with invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/users/sessions',
        payload: {
          email: testUser.email,
          password: 'wrongpassword'
        }
      })

      expect(response.statusCode).toBe(401)
      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Unauthorized')
      expect(body.message).toBe('Invalid email or password')
    })

    it('should block after too many failed attempts', async () => {
      // Try to authenticate multiple times with wrong password
      for (let i = 0; i < 5; i++) {
        await app.inject({
          method: 'POST',
          url: '/api/users/sessions',
          payload: {
            email: testUser.email,
            password: 'wrongpassword'
          }
        })
      }

      const response = await app.inject({
        method: 'POST',
        url: '/api/users/sessions',
        payload: {
          email: testUser.email,
          password: testUser.password
        }
      })

      expect(response.statusCode).toBe(429)
      const body = JSON.parse(response.payload)
      expect(body.error).toBe('Too Many Attempts')
      expect(body).toHaveProperty('timeToUnblock')
    })
  })

  describe('GET /api/users', () => {
    it('should list all users', async () => {
      // Create multiple users
      const users = Array.from({ length: 3 }, () => ({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'TestPassword123!'
      }))

      for (const user of users) {
        await app.inject({
          method: 'POST',
          url: '/api/users',
          payload: user
        })
      }

      // Authenticate to get a token
      const authResponse = await app.inject({
        method: 'POST',
        url: '/api/users/sessions',
        payload: {
          email: users[0].email,
          password: users[0].password
        }
      })
      const { token } = JSON.parse(authResponse.payload)

      const response = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.users).toHaveLength(3)
      expect(body.users[0]).toHaveProperty('id')
      expect(body.users[0]).toHaveProperty('name')
      expect(body.users[0]).toHaveProperty('email')
    })
  })

  describe('DELETE /api/users/all', () => {
    it('should delete all users', async () => {
      // Create a regular user
      await app.inject({
        method: 'POST',
        url: '/api/users',
        payload: testUser
      })

      // Create an admin user directly in the database
      const client = await pool.connect()
      try {
        const password_hash = await bcrypt.hash(adminUser.password, 6)
        await client.query(
          'INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [adminUser.name, adminUser.email, password_hash, 'admin']
        )
      } finally {
        client.release()
      }

      // Authenticate as admin to get a token
      const authResponse = await app.inject({
        method: 'POST',
        url: '/api/users/sessions',
        payload: {
          email: adminUser.email,
          password: adminUser.password
        }
      })
      const { token } = JSON.parse(authResponse.payload)

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/users/all',
        headers: {
          authorization: `Bearer ${token}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.payload)
      expect(body.message).toBe('All users deleted successfully')
      expect(body.deletedCount).toBeGreaterThan(0)

      // Verify users are deleted
      const listResponse = await app.inject({
        method: 'GET',
        url: '/api/users',
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      const listBody = JSON.parse(listResponse.payload)
      expect(listBody.users).toHaveLength(0)
    })
  })
}) 