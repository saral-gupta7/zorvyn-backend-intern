import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { transaction } from "../../db/schema/schema";

export type TransactionFilters = {
  type?: "income" | "expense";
  category?: string;
  from?: string;
  to?: string;
  sortBy?: "date" | "amount" | "created_at";
  order?: "asc" | "desc";
};

export type CreateTransactionDTO = {
  description: string;
  transaction_type?: "income" | "expense";
  category: string;
  amount: number;
  date?: string;
  user_id: string;
};

export type UpdateTransactionDTO = Partial<CreateTransactionDTO>;

function buildSortColumn(sortBy?: TransactionFilters["sortBy"]) {
  switch (sortBy) {
    case "amount":
      return transaction.amount;
    case "created_at":
      return transaction.created_at;
    case "date":
    default:
      return transaction.date;
  }
}

function normalizeTransactionData(
  data: CreateTransactionDTO | UpdateTransactionDTO,
) {
  return {
    ...data,
    amount:
      data.amount !== undefined ? data.amount.toFixed(2) : data.amount,
    date: data.date ? new Date(data.date) : undefined,
  };
}

export async function getAllTransactions(
  page: number,
  limit: number,
  filters: TransactionFilters,
) {
  const offset = (page - 1) * limit;
  const conditions = [];

  if (filters.type) {
    conditions.push(eq(transaction.transaction_type, filters.type));
  }

  if (filters.category) {
    conditions.push(eq(transaction.category, filters.category));
  }

  if (filters.from) {
    conditions.push(gte(transaction.date, new Date(filters.from)));
  }

  if (filters.to) {
    const endDate = new Date(filters.to);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(transaction.date, endDate));
  }

  const whereClause = conditions.length ? and(...conditions) : undefined;
  const orderByColumn = buildSortColumn(filters.sortBy);
  const orderByDirection =
    filters.order === "asc" ? asc(orderByColumn) : desc(orderByColumn);

  const data = await db
    .select({
      id: transaction.id,
      description: transaction.description,
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      created_at: transaction.created_at,
      updated_at: transaction.updated_at,
      user_id: transaction.user_id,
    })
    .from(transaction)
    .where(whereClause)
    .orderBy(orderByDirection)
    .limit(limit)
    .offset(offset);

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(transaction)
    .where(whereClause);

  const totalPages = Math.ceil(count / limit);

  return { data, total: count, page, limit, totalPages };
}

export async function getTransactionById(id: string) {
  const foundTransaction = await db.query.transaction.findFirst({
    where: eq(transaction.id, id),
  });

  if (!foundTransaction) {
    throw new Error("Transaction not found!");
  }

  return foundTransaction;
}

export async function createTransaction(data: CreateTransactionDTO) {
  const [newTransaction] = await db
    .insert(transaction)
    .values(normalizeTransactionData(data))
    .returning();

  return { success: true, data: newTransaction };
}

export async function updateTransaction(
  id: string,
  data: UpdateTransactionDTO,
) {
  const transactionToUpdate = await db.query.transaction.findFirst({
    where: eq(transaction.id, id),
  });

  if (!transactionToUpdate) {
    throw new Error("Transaction not found!");
  }

  const [updatedTransaction] = await db
    .update(transaction)
    .set({
      ...normalizeTransactionData(data),
      updated_at: new Date(),
    })
    .where(eq(transaction.id, id))
    .returning();

  return updatedTransaction;
}

export async function deleteTransaction(id: string) {
  const foundTransaction = await db.query.transaction.findFirst({
    where: eq(transaction.id, id),
  });

  if (!foundTransaction) {
    throw new Error("Transaction not found!");
  }

  await db.delete(transaction).where(eq(transaction.id, id));

  return {
    message: "Transaction deleted successfully",
  };
}
