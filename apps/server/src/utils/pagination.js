import { z } from "zod";

const cursorSchema = z
  .object({
    cursor: z.string().optional(),
    take: z
      .string()
      .transform((val) => Number.parseInt(val, 10))
      .pipe(z.number().int().positive().max(100))
      .optional(),
  })
  .strict();

export function parseCursorParams(params = {}) {
  const result = cursorSchema.safeParse(params);
  if (!result.success) {
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));
    const error = new Error("Invalid pagination parameters");
    error.status = 422;
    error.meta = { issues };
    throw error;
  }

  const { cursor, take } = result.data;
  const takeValue = Number.isInteger(take) ? take : 25;
  return { cursor, take: takeValue };
}

export async function paginateQuery({
  model,
  cursor,
  take,
  where = {},
  orderBy = { createdAt: "desc" },
  select,
  include,
}) {
  const queryArgs = {
    take: take + 1,
    where,
    orderBy,
    ...(select ? { select } : {}),
    ...(include ? { include } : {}),
  };

  if (cursor) {
    queryArgs.cursor = { id: cursor };
    queryArgs.skip = 1;
  }

  const results = await model.findMany(queryArgs);

  let nextCursor = null;
  if (results.length > take) {
    const nextItem = results.pop();
    nextCursor = nextItem.id;
  }

  return {
    data: results,
    meta: {
      nextCursor,
      count: results.length,
    },
  };
}
