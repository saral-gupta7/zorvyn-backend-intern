import { Elysia, t } from "elysia";
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
} from "./transaction.service";
import { handleRouteError } from "../../utils/responses";
import { requireRole } from "../../middleware/rbac.middleware";

const transactionBody = t.Object({
  description: t.String({ minLength: 1 }),
  transaction_type: t.Optional(
    t.Union([t.Literal("income"), t.Literal("expense")]),
  ),
  category: t.String({ minLength: 1 }),
  amount: t.Number(),
  date: t.Optional(t.String()),
});

const transactionUpdateBody = t.Partial(transactionBody);

export const transactionReadRoutes = new Elysia({ prefix: "/transactions" })
  .use(requireRole("admin", "analyst"))
  .get(
    "/",
    async ({ query, set }) => {
      try {
        const { page, limit, type, category, from, to, sortBy, order } = query;

        return await getAllTransactions(page, limit, {
          type,
          category,
          from,
          to,
          sortBy,
          order,
        });
      } catch (error) {
        return handleRouteError(error, set);
      }
    },
    {
      query: t.Object({
        page: t.Optional(t.Numeric({ default: 1 })),
        limit: t.Optional(t.Numeric({ default: 10 })),
        type: t.Optional(t.Union([t.Literal("income"), t.Literal("expense")])),
        category: t.Optional(t.String()),
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
        sortBy: t.Optional(
          t.Union([
            t.Literal("date"),
            t.Literal("amount"),
            t.Literal("created_at"),
          ]),
        ),
        order: t.Optional(t.Union([t.Literal("asc"), t.Literal("desc")])),
      }),
    },
  )
  .get("/:id", async ({ params, set }) => {
    try {
      const { id } = params;
      return await getTransactionById(id);
    } catch (error) {
      return handleRouteError(error, set, "Transaction not found!");
    }
  });

export const transactionWriteRoutes = new Elysia({ prefix: "/transactions" })
  .use(requireRole("admin"))
  .post(
    "/",
    async ({ body, set, user }) => {
      try {
        const result = await createTransaction({
          ...body,
          user_id: user.user_id,
        });
        set.status = 201;
        return result;
      } catch (error) {
        return handleRouteError(error, set);
      }
    },
    {
      body: transactionBody,
    },
  )
  .patch(
    "/:id",
    async ({ body, set, params }) => {
      try {
        const { data } = body;
        const { id } = params;
        return await updateTransaction(id, data);
      } catch (error) {
        return handleRouteError(error, set, "Transaction not found!");
      }
    },
    {
      body: t.Object({
        data: transactionUpdateBody,
      }),
    },
  )
  .delete("/:id", async ({ params, set }) => {
    try {
      const { id } = params;
      return await deleteTransaction(id);
    } catch (error) {
      return handleRouteError(error, set, "Transaction not found!");
    }
  });
