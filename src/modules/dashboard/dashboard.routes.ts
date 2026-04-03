import { Elysia, t } from "elysia";
import {
  getByCategory,
  getRecent,
  getSummary,
  getTrends,
} from "./dashboard.service";
import { handleRouteError } from "../../utils/responses";
import { requireRole } from "../../middleware/rbac.middleware";

export const dashboardRoutes = new Elysia({ prefix: "/dashboard" })
  .use(requireRole("analyst", "admin"))
  .get(
    "/summary",
    async ({ query, set }) => {
      try {
        const { from, to } = query;
        return await getSummary(from, to);
      } catch (error) {
        return handleRouteError(error, set);
      }
    },
    {
      query: t.Object({
        from: t.Optional(t.String()),
        to: t.Optional(t.String()),
      }),
    },
  )
  .get("/by-category", async ({ set }) => {
    try {
      return await getByCategory();
    } catch (error) {
      return handleRouteError(error, set);
    }
  })
  .get(
    "/trends",
    async ({ query, set }) => {
      try {
        const { months } = query;
        return await getTrends(months);
      } catch (error) {
        return handleRouteError(error, set);
      }
    },
    {
      query: t.Object({
        months: t.Optional(t.Numeric({ default: 6 })),
      }),
    },
  )
  .get(
    "/recent",
    async ({ query, set }) => {
      try {
        const { limit } = query;
        return await getRecent(limit);
      } catch (error) {
        return handleRouteError(error, set);
      }
    },
    {
      query: t.Object({
        limit: t.Optional(t.Numeric({ default: 5 })),
      }),
    },
  );
