import { z } from 'zod';

// Input schema for /identify endpoint
export const IdentifyRequestSchema = z.object({
  email: z.string().max(1000).email().optional().nullable(),
  phoneNumber: z.string().min(1).max(20).optional().nullable()
}).refine(
  (data) => data.email ?? data.phoneNumber,
  {
    message: "Either email or phoneNumber must be provided",
    path: ["email", "phoneNumber"]
  }
);

// Output schema for /identify endpoint response
export const IdentifyResponseSchema = z.object({
  contact: z.object({
    primaryContactId: z.number().int().positive(),
    emails: z.array(z.string().email()),
    phoneNumbers: z.array(z.string()),
    secondaryContactIds: z.array(z.number().int().positive())
  })
});

// Error response schema
export const ErrorResponseSchema = z.object({
  error: z.string()
});

// Type inference from schemas
export type IdentifyRequest = z.infer<typeof IdentifyRequestSchema>;
export type IdentifyResponse = z.infer<typeof IdentifyResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;