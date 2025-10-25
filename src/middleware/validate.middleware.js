// src/middleware/validate.js
import { ZodError } from "zod";

export function validate(schema) {
  return (req, _res, next) => {
    try {
      // Merge path/query/body for convenience, but primarily validate body
      const payload = { body: req.body, params: req.params, query: req.query };
      const parsed = schema.parse(payload);
      // overwrite req.body/params with parsed safe values if you want
      if (parsed?.body) req.body = parsed.body;
      if (parsed?.params) req.params = parsed.params;
      if (parsed?.query) req.query = parsed.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        // attach friendly info and bubble to central handler
        err.status = 400;
        err.title = "Validation Error";
        err.friendly = {
          message: "Please fix the highlighted fields and try again.",
          issues: err.issues.map((i) => ({
            path: i.path.join("."),
            message: i.message,
          })),
        };
      }
      next(err);
    }
  };
}
