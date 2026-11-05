import { z } from 'zod'

export const createTenantSchema = z.object({
  name: z.string().min(1, 'Tenant name is required'),
  slug: z
    .string()
    .min(1, 'Slug is required')
    .regex(
      /^[a-z0-9.-]+$/,
      'Slug must be lowercase and contain only letters, numbers, dots, and hyphens',
    ),
  logo: z
    .string()
    .refine(
      (value) => {
        if (!value || value === '') return true
        try {
          new URL(value)
          return true
        } catch {
          return false
        }
      },
      'Logo must be a valid URL',
    )
    .optional(),
})

export type CreateTenantFormState = z.infer<typeof createTenantSchema>

