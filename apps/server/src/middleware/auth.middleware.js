// src/middleware/auth.middleware.js

export function attachUser(req, _res, next) {
  const id = req.get("x-user-id") || "admin";
  const name = req.get("x-user-name") || "Discovery Admin";
  const role = req.get("x-user-role") || "ADMIN";
  req.user = { id, name, role };
  next();
}

export function requireAdmin(req, res, next) {
  if (req.user?.role !== "ADMIN") {
    if (req.accepts('html')) {
      return res.status(403).render('error', {
        title: 'Forbidden',
        status: 403,
        message: 'You need admin access to view discovery tooling.',
        issues: [],
      });
    }
    return res.status(403).json({ error: 'forbidden' });
  }
  next();
}
