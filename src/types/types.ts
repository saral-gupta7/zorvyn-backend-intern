import { z } from "zod";
import { UserSchema } from "../db/schema/schema";
import { createUpdateSchema } from "drizzle-zod";
import { user } from "../db/schema/schema";

export type InsertUser = z.infer<typeof UserSchema>;

export const UserUpdateSchema = createUpdateSchema(user, {
  email: z.email(),
  username: z.string().min(3).max(25),
}).omit({
  id: true,
  created_at: true,
  updated_at: true,
  password_hash: true,
});

export type UserUpdate = z.infer<typeof UserUpdateSchema>;
