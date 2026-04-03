import { Elysia } from "elysia";
import { jwtSetup } from "../modules/auth/auth.jwt";

export const authMiddleware = new Elysia({ name: "middleware:auth" })
  .use(jwtSetup)
  .derive({ as: "global" }, async ({ headers, jwt, set }) => {
    const authHeader = headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      set.status = 401;
      throw new Error("Missing or invalid token");
    }

    const token = authHeader.replace("Bearer ", "");
    const payload = await jwt.verify(token);

    if (!payload) {
      set.status = 401;
      throw new Error("Invalid or expired token");
    }

    return { user: payload };
  });
