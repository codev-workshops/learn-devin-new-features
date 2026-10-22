import type { NextFunction, Request, Response } from "express";
import { BRAND_IDS, HEADERS, type BrandId, type Role } from "@harbourline/contracts";
import { badRequest, forbidden } from "../errors.js";

export interface Caller {
  brand: BrandId;
  user: string;
  role: Role;
}

declare module "express-serve-static-core" {
  interface Request {
    caller: Caller;
    rawBody?: Buffer;
  }
}

const ROLES: Role[] = ["customer", "merchandiser", "admin"];

/** Fake login: three headers, no tokens. Every brand-scoped route runs through this. */
export function requireCaller(req: Request, _res: Response, next: NextFunction): void {
  const brand = req.header(HEADERS.brand);
  const user = req.header(HEADERS.user);
  const role = (req.header(HEADERS.role) ?? "customer") as Role;
  if (!brand || !(BRAND_IDS as readonly string[]).includes(brand)) {
    next(badRequest(`${HEADERS.brand} header must be one of ${BRAND_IDS.join(", ")}`));
    return;
  }
  if (!user || !user.includes("@")) {
    next(badRequest(`${HEADERS.user} header must be a seeded email`));
    return;
  }
  if (!ROLES.includes(role)) {
    next(badRequest(`${HEADERS.role} header must be one of ${ROLES.join(", ")}`));
    return;
  }
  req.caller = { brand: brand as BrandId, user, role };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!roles.includes(req.caller.role)) {
      next(forbidden(`${HEADERS.role} must be one of ${roles.join(", ")} for this route`));
      return;
    }
    next();
  };
}

export const isStaff = (c: Caller) => c.role === "merchandiser" || c.role === "admin";
