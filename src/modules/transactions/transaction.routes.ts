import { Elysia, t } from "elysia";
import {
  createTransaction,
  deleteTransaction,
  getAllTransactions,
  getTransactionById,
  updateTransaction,
} from "./transaction.service";

const transactionBody = t.Object({
  description: t.String({ minLength: 1 }),
  transaction_type: t.Optional(
    t.Union([t.Literal("income"), t.Literal("expense")]),
  ),
  category: t.String({ minLength: 1 }),
  amount: t.Number(),
  date: t.Optional(t.String()),
  user_id: t.String(),
});

const transactionUpdateBody = t.Partial(transactionBody);

export const transactionRoutes = new Elysia({ prefix: "/transactions" })
  .get(
    "/",
    async ({ query }) => {
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
        console.log("Failed to fetch transactions");
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
  .post(
    "/",
    async ({ body, set }) => {
      try {
        const result = await createTransaction(body);
        set.status = 201;
        return result;
      } catch (error: any) {
        set.status = 400;
        return { error: error.message };
      }
    },
    {
      body: transactionBody,
    },
  )
  .patch(
    "/",
    async ({ body }) => {
      try {
        const { id, data } = body;
        return await updateTransaction(id, data);
      } catch (error) {
        console.log("Failed to update transaction");
      }
    },
    {
      body: t.Object({
        id: t.String(),
        data: transactionUpdateBody,
      }),
    },
  )
  .get("/:id", async ({ params }) => {
    try {
      const { id } = params;
      return await getTransactionById(id);
    } catch (error) {
      console.log("Failed to fetch transaction");
    }
  })
  .delete("/:id", async ({ params }) => {
    try {
      const { id } = params;
      return await deleteTransaction(id);
    } catch (error) {
      console.log("Failed to delete transaction");
    }
  });
