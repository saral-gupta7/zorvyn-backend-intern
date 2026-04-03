import { Elysia } from "elysia";
import { jwt } from "@elysiajs/jwt";

const JWT_SECRET = process.env.JWT_SECRET!;

export const jwtSetup = new Elysia({ name: "setup:jwt" }).use(
  jwt({
    name: "jwt",
    secret: JWT_SECRET,
    exp: "1h",
  }),
);
