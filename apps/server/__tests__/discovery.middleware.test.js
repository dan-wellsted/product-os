import { describe, it, expect, jest } from "@jest/globals";
import { attachUser, requireAdmin } from "../src/middleware/auth.middleware.js";
import { discoveryAuditLogger } from "../src/middleware/logging.middleware.js";

describe("auth middleware", () => {
  it("attaches default admin user when headers missing", () => {
    const req = { get: jest.fn(() => undefined) };
    const next = jest.fn();
    attachUser(req, {}, next);
    expect(req.user).toEqual({ id: "admin", name: "Discovery Admin", role: "ADMIN" });
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("uses header values when provided", () => {
    const req = { get: jest.fn((key) => ({ "x-user-id": "u1", "x-user-name": "Taylor", "x-user-role": "MEMBER" })[key]) };
    const next = jest.fn();
    attachUser(req, {}, next);
    expect(req.user).toEqual({ id: "u1", name: "Taylor", role: "MEMBER" });
  });

  it("blocks non-admin JSON clients", () => {
    const req = { user: { role: "MEMBER" }, accepts: jest.fn(() => false) };
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: "forbidden" });
    expect(next).not.toHaveBeenCalled();
  });

  it("blocks non-admin HTML clients with error view", () => {
    const req = { user: { role: "MEMBER" }, accepts: jest.fn(() => true) };
    const res = { status: jest.fn().mockReturnThis(), render: jest.fn() };
    const next = jest.fn();
    requireAdmin(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.render).toHaveBeenCalledWith("error", expect.objectContaining({ status: 403 }));
    expect(next).not.toHaveBeenCalled();
  });

  it("allows admins through", () => {
    const req = { user: { role: "ADMIN" } };
    const next = jest.fn();
    requireAdmin(req, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe("discovery audit logger", () => {
  it("logs request metrics on finish", () => {
    const consoleSpy = jest.spyOn(console, "log").mockImplementation(() => {});
    const listeners = {};
    const req = { method: "GET", originalUrl: "/discovery/projects/1", user: { id: "admin" } };
    const res = {
      statusCode: 200,
      on: (event, cb) => {
        listeners[event] = cb;
      },
    };
    const next = jest.fn();
    discoveryAuditLogger(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    listeners.finish();
    expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("[discovery] GET /discovery/projects/1 200 user=admin"));
    consoleSpy.mockRestore();
  });
});
