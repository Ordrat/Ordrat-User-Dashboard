import { z } from 'zod';

export const BranchSchema = z
  .object({
    id: z.string(),
    nameEn: z.string().optional(),
    nameAr: z.string().optional(),
    isMain: z.boolean().optional(),
  })
  .passthrough();

export const LoginResponseSchema = z.object({
  accessToken: z.string().min(1),
  refreshToken: z.string().min(1),
  shopId: z.string(),
  id: z.string().min(1),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  branches: z.array(BranchSchema),
  userType: z.coerce.string(),
  subdomain: z.string(),
});

// Refresh response has the same shape as login
export const RefreshResponseSchema = LoginResponseSchema;

export type LoginResponseType = z.infer<typeof LoginResponseSchema>;
export type RefreshResponseType = z.infer<typeof RefreshResponseSchema>;
export type BranchType = z.infer<typeof BranchSchema>;
