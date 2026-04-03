import { Elysia } from "elysia";
import { login, register } from "./modules/auth/auth.routes";
import { transactionRoutes } from "./modules/transactions/transaction.routes";
import { userRoutes } from "./modules/users/users.routes";

export const app = new Elysia()
.
onafterhandle(({ set }) => {
  set.headers["x-content-type-options"] = "nosniff";
  set.headers["x-frame-options"] = "deny";
  set.headers["x-xss-protection"] = "1; mode=block";
  set.headers["referrer-policy"] = "strict-origin-when-cross-origin";
});
  .use(login)
  .use(register)
  .use(userRoutes)
  .use(transactionRoutes);

