import { z } from "zod"

export const formSchema = z.object({
  personalInfo: z.object({
    firstName: z.string().trim().max(100),
    lastName: z.string().trim().max(100)
  }),

  address: z.object({
    city: z.string().trim().max(100),
    zipCode: z.string().trim().max(20)
  }),

  preferences: z.object({
    newsletter: z.boolean()
  })
}).strict()

export type FormDataDTO = z.infer<typeof formSchema>