import { z } from "zod";

export const UserSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  email: z.string().email(),
});

export type User = z.infer<typeof UserSchema>;

export const CreateUserInput = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});
export type CreateUserInput = z.infer<typeof CreateUserInput>;
