import { z } from 'zod'

export const createUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email('Email must be a valid email address').min(1, 'Email is required'),
  password: z.string().optional(),
  tenantId: z.string().optional(),
  role: z.string().optional(),
  active: z.boolean().default(true),
})

export type CreateUserFormState = z.infer<typeof createUserSchema>

