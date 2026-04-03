import { Elysia } from "elysia";
import { authMiddleware } from "./auth.middleware";

export const requireRole = (...roles: string[]) =>
  new Elysia({ name: `middleware:rbac:${roles.join(",")}` })

    .use(authMiddleware)
    .onBeforeHandle({ as: "global" }, ({ user, set }) => {
      if (!roles.includes(user.role)) {
        set.status = 403;
        throw new Error("Forbidden");
      }
    });
