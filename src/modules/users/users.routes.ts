import { Elysia, t } from "elysia";
import {
  deleteUser,
  getAllUsers,
  getUserById,
  updateUser,
} from "./users.service";

const userUpdateBody = t.Object({
  id: t.String(),
  data: t.Partial(
    t.Object({
      username: t.String({ minLength: 3, maxLength: 25 }),
      email: t.String({ format: "email" }),
      role: t.Optional(
        t.Union([
          t.Literal("admin"),
          t.Literal("analyst"),
          t.Literal("viewer"),
        ]),
      ),
      status: t.Optional(t.Union([t.Literal("active"), t.Literal("inactive")])),
    }),
  ),
});

export const userRoutes = new Elysia({ prefix: "/users" })
  .get(
    "/",
    async ({ query }) => {
      try {
        const { page, limit } = query;
        const result = await getAllUsers(page, limit);
        return result;
      } catch (error) {
        console.log("Failed to fetch users");
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ default: 1 })),
        limit: t.Optional(t.Numeric({ default: 2 })),
      }),
    },
  )
  .patch(
    "/",
    async ({ body }) => {
      try {
        const { id, data } = body;
        const updates = await updateUser(id, data);

        return updates;
      } catch (error) {
        console.log("Failed to update user");
      }
    },
    {
      body: userUpdateBody,
    },
  )
  .get(":id", async ({ params }) => {
    try {
      const { id } = params;
      const user = await getUserById(id);
      return user;
    } catch (error) {
      console.log("Failed to fetch user");
    }
  })
  .delete("/:id", async ({ params }) => {
    try {
      const { id } = params;
      const res = await deleteUser(id);
      return res;
    } catch (error) {
      console.log("Failed to delete users");
    }
  });
