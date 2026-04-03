import { db } from "../../db";
import { user } from "../../db/schema/schema";

import { UserUpdate } from "../../types/types";

import { eq, sql } from "drizzle-orm";

export async function getAllUsers(page: number, limit: number) {
  const offset = (page - 1) * limit;
  const data = await db
    .select({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
    })
    .from(user)
    .limit(limit)
    .offset(offset);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(user);

  const totalPages = Math.ceil(count / limit);
  return { data, total: count, page, limit, totalPages };
}

export async function getUserById(id: string) {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  if (!foundUser) {
    throw new Error("User not found!");
  }

  return {
    username: foundUser.username,
    email: foundUser.email,
    role: foundUser.role,
    status: foundUser.status,
  };
}

export async function updateUser(id: string, data: UserUpdate) {
  const userToUpdate = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  if (!userToUpdate) {
    throw new Error("User not found!");
  }

  const newEntry = await db
    .update(user)
    .set({ ...data, created_at: new Date() })
    .where(eq(user.id, id))
    .returning();

  return newEntry;
}

export async function deleteUser(id: string) {
  const foundUser = await db.query.user.findFirst({
    where: eq(user.id, id),
  });

  if (!foundUser) {
    throw new Error("User not found!");
  }
  await db.delete(user).where(eq(user.id, id));

  return {
    message: "User deleted sucessfully",
  };
}
