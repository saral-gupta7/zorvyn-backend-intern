import { Elysia } from "elysia";
import { login, register } from "./modules/auth/auth.routes";
import { dashboardRoutes } from "./modules/dashboard/dashboard.routes";
import {
  transactionReadRoutes,
  transactionWriteRoutes,
} from "./modules/transactions/transaction.routes";
import { userRoutes } from "./modules/users/users.routes";
import { rateLimit } from "elysia-rate-limit";

import swagger from "@elysiajs/swagger";

import { cors } from "@elysiajs/cors";
import { authMiddleware } from "./middleware/auth.middleware";

export const app = new Elysia()
  .use(swagger({}))
  .onAfterHandle(({ set }) => {
    set.headers["x-content-type-options"] = "nosniff";
    set.headers["x-frame-options"] = "deny";
    set.headers["x-xss-protection"] = "1; mode=block";
    set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
  })
  .use(
    rateLimit({
      duration: 60000,
      max: 10,
    }),
  )
  .onRequest(({ request }) => {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${request.url}`,
    );
  })
  .use(
    cors({
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://finapi.srlgpta.xyz"]
          : true,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      credentials: true,
    }),
  )
  .use(login)
  .use(register)
  .use(authMiddleware)
  .use(userRoutes)
  .use(dashboardRoutes)
  .use(transactionReadRoutes)
  .use(transactionWriteRoutes);
