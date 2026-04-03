import { Elysia, t } from "elysia";
import { loginUser, registerUser } from "./auth.service";
import { jwtSetup } from "./auth.jwt";

export const register = new Elysia({ prefix: "/auth/register" }).post(
  "/",
  async ({ body, set }) => {
    try {
      const result = await registerUser(body);
      set.status = 201;
      return result;
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  },
  {
    body: t.Object({
      username: t.String({ minLength: 2 }),
      email: t.String({ format: "email" }),
      password: t.String({ minLength: 6 }),
      role: t.Optional(
        t.Union([
          t.Literal("admin"),
          t.Literal("analyst"),
          t.Literal("viewer"),
        ]),
      ),
    }),
  },
);

export const login = new Elysia({ prefix: "/auth/login" }).use(jwtSetup).post(
  "/",
  async ({ body, set, jwt }) => {
    try {
      const res = await loginUser(body);
      const token = await jwt.sign({
        email: res.user.email,
        userId: res.user.id,
        role: res.user.role,
      });
      // auth_session.set({
      //   value: token,
      //   httpOnly: true,
      //   secure: process.env.NODE_ENV === "production",
      //   sameSite: "strict",
      //   maxAge: 7 * 86400,
      //   path: "/",
      // });
      set.status = 200;
      return { ...res, token };
    } catch (error: any) {
      set.status = 400;
      return { error: error.message };
    }
  },
  {
    body: t.Object({
      email: t.String({ format: "email" }),
      password: t.String(),
    }),
  },
);
