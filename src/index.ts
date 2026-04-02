import { Elysia } from "elysia";
import { createInsertSchema } from "drizzle-zod";

import { db } from "./db";

import { user } from "./db/schema/schema";

const PORT = process.env.PORT;
export const insertUserSchema = createInsertSchema(user).omit({
  id: true,
  created_at: true,
  updated_at: true,
});

const createUser = new Elysia()
  .post(
    "/register",
    async ({ body, set }) => {
      try {
        const hashedPassword = await Bun.password.hash(body.password_hash);
        const [newUser] = await db
          .insert(user)
          .values({
            ...body,
            password_hash: hashedPassword,
          })
          .returning();

        set.status = 201;
        return {
          message: `User ${newUser.username} has been created`,
          data: newUser,
        };
      } catch (error: any) {
        if (error.code === "23505") {
          set.status = 409;
          return { error: "Email or username already exists" };
        }

        set.status = 500;
        return { error: "Internal Server Error" };
      }
    },
    {
      body: insertUserSchema,
    },
  )
  .listen(PORT);
