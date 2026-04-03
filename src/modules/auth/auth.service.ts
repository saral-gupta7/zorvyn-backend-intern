import { db } from "../../db";
import { user } from "../../db/schema/schema";
import { InsertUser } from "../../types/types";
import { eq } from "drizzle-orm";

export type RegisterDTO = Omit<
  InsertUser,
  "password_hash" | "created_at" | "id"
> & {
  password: string;
};

async function hashPassword(password: string) {
  return await Bun.password.hash(password);
}

async function verifyPassword(password: string, hash: string) {
  return await Bun.password.verify(password, hash);
}

export async function registerUser(data: RegisterDTO) {
  const { username, password, email, role } = data;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, normalizedEmail),
  });

  if (existingUser && existingUser.email === normalizedEmail) {
    throw new Error("A user with this email already exists.");
  }

  const hashedPassword = await hashPassword(password);

  const [newUser] = await db
    .insert(user)
    .values({
      username,
      password_hash: hashedPassword,
      email: normalizedEmail,
      role,
    })
    .returning({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
    });
  return { success: true, data: newUser };
}

export type LoginDTO = {
  email: string;
  password: string;
};

export async function loginUser(data: LoginDTO) {
  const { email, password } = data;
  const normalizedEmail = email.toLowerCase().trim();

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, normalizedEmail),
  });

  if (!existingUser) {
    throw new Error("User does not exist");
  }

  const isPasswordVerified = await verifyPassword(
    password,
    existingUser.password_hash,
  );

  if (!isPasswordVerified) {
    throw new Error("Invalid email or password.");
  }

  return {
    success: true,
    message: "Login Successful",
    user: {
      id: existingUser.id,
      username: existingUser.username,
      email: existingUser.email,
      role: existingUser.role,
    },
  };
}
