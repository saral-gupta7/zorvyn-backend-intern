import { and, asc, desc, gte, lte, sql } from "drizzle-orm";
import { db } from "../../db";
import { transaction } from "../../db/schema/schema";

function parseAmount(value: unknown) {
  if (typeof value === "number") {
    return value;
  }

  if (typeof value === "string") {
    return Number(value);
  }

  return 0;
}

function buildDateRangeConditions(from?: string, to?: string) {
  const conditions = [];

  if (from) {
    conditions.push(gte(transaction.date, new Date(from)));
  }

  if (to) {
    const endDate = new Date(to);
    endDate.setHours(23, 59, 59, 999);
    conditions.push(lte(transaction.date, endDate));
  }

  return conditions;
}

function formatMonth(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

export async function getSummary(from?: string, to?: string) {
  const conditions = buildDateRangeConditions(from, to);
  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [summary] = await db
    .select({
      totalIncome: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'income' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
      totalExpenses: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'expense' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
      transactionCount: sql<number>`count(*)`,
    })
    .from(transaction)
    .where(whereClause);

  const totalIncome = parseAmount(summary?.totalIncome);
  const totalExpenses = parseAmount(summary?.totalExpenses);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: Number(summary?.transactionCount ?? 0),
  };
}

export async function getByCategory() {
  const rows = await db
    .select({
      category: transaction.category,
      income: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'income' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
      expenses: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'expense' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
    })
    .from(transaction)
    .groupBy(transaction.category)
    .orderBy(asc(transaction.category));

  return rows.map((row) => ({
    category: row.category,
    income: parseAmount(row.income),
    expenses: parseAmount(row.expenses),
  }));
}

export async function getTrends(months = 6) {
  const normalizedMonths = Math.max(1, months);
  const startDate = new Date();
  startDate.setDate(1);
  startDate.setHours(0, 0, 0, 0);
  startDate.setMonth(startDate.getMonth() - (normalizedMonths - 1));

  const rows = await db
    .select({
      month: sql<string>`
        to_char(date_trunc('month', ${transaction.date}), 'YYYY-MM')
      `,
      income: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'income' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
      expenses: sql<string>`
        coalesce(
          sum(
            case
              when ${transaction.transaction_type} = 'expense' then ${transaction.amount}
              else 0::numeric
            end
          ),
          0::numeric
        )
      `,
    })
    .from(transaction)
    .where(gte(transaction.date, startDate))
    .groupBy(sql`date_trunc('month', ${transaction.date})`)
    .orderBy(asc(sql`date_trunc('month', ${transaction.date})`));

  const trendMap = new Map(
    rows.map((row) => [
      row.month,
      {
        income: parseAmount(row.income),
        expenses: parseAmount(row.expenses),
      },
    ]),
  );

  return Array.from({ length: normalizedMonths }, (_, index) => {
    const monthDate = new Date(startDate);
    monthDate.setMonth(startDate.getMonth() + index);

    const month = formatMonth(monthDate);
    const existing = trendMap.get(month);

    return {
      month,
      income: existing?.income ?? 0,
      expenses: existing?.expenses ?? 0,
    };
  });
}

export async function getRecent(limit = 5) {
  const normalizedLimit = Math.max(1, limit);

  const rows = await db
    .select({
      id: transaction.id,
      description: transaction.description,
      transaction_type: transaction.transaction_type,
      category: transaction.category,
      amount: transaction.amount,
      date: transaction.date,
      created_at: transaction.created_at,
      user_id: transaction.user_id,
    })
    .from(transaction)
    .orderBy(desc(transaction.date))
    .limit(normalizedLimit);

  return rows.map((row) => ({
    ...row,
    amount: parseAmount(row.amount),
  }));
}
