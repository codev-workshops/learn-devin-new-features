import type { ApiError } from "@harbourline/contracts";
import { MONEY_PATTERN, SKU_PATTERN } from "@harbourline/contracts";
import { validationFailed } from "../errors.js";

type Detail = NonNullable<ApiError["details"]>[number];

export class Validator {
  readonly details: Detail[] = [];

  constructor(private readonly body: unknown) {}

  private get obj(): Record<string, unknown> {
    return typeof this.body === "object" && this.body !== null
      ? (this.body as Record<string, unknown>)
      : {};
  }

  fail(path: string, message: string): undefined {
    this.details.push({ path, message });
    return undefined;
  }

  string(path: string, opts: { required?: boolean; pattern?: RegExp; max?: number } = {}) {
    const v = this.obj[path];
    if (v === undefined || v === null) {
      return opts.required === false ? undefined : this.fail(path, "is required");
    }
    if (typeof v !== "string" || v.length === 0)
      return this.fail(path, "must be a non-empty string");
    if (opts.pattern && !opts.pattern.test(v))
      return this.fail(path, `does not match ${opts.pattern}`);
    if (opts.max && v.length > opts.max)
      return this.fail(path, `must be at most ${opts.max} characters`);
    return v;
  }

  integer(path: string, opts: { min?: number; max?: number; required?: boolean } = {}) {
    const v = this.obj[path];
    if (v === undefined || v === null) {
      return opts.required === false ? undefined : this.fail(path, "is required");
    }
    if (typeof v !== "number" || !Number.isInteger(v)) return this.fail(path, "must be an integer");
    if (opts.min !== undefined && v < opts.min) return this.fail(path, `must be >= ${opts.min}`);
    if (opts.max !== undefined && v > opts.max) return this.fail(path, `must be <= ${opts.max}`);
    return v;
  }

  oneOf<T extends string>(path: string, values: readonly T[], opts: { required?: boolean } = {}) {
    const v = this.string(path, opts);
    if (v === undefined) return undefined;
    if (!(values as readonly string[]).includes(v))
      return this.fail(path, `must be one of ${values.join(", ")}`);
    return v as T;
  }

  object(path: string) {
    const v = this.obj[path];
    if (typeof v !== "object" || v === null || Array.isArray(v))
      return this.fail(path, "must be an object");
    return new Validator(v);
  }

  array(path: string) {
    const v = this.obj[path];
    if (!Array.isArray(v)) return this.fail(path, "must be an array");
    return v.map((item) => new Validator(item));
  }

  money(path: string, opts: { required?: boolean } = {}) {
    const v = this.object(path);
    if (!v) {
      if (opts.required === false && this.obj[path] === undefined) {
        this.details.pop();
        return undefined;
      }
      return undefined;
    }
    const amount = v.string("amount", { pattern: MONEY_PATTERN });
    const currency = v.oneOf("currency", ["USD", "EUR"] as const);
    this.details.push(...v.details.map((d) => ({ path: `${path}.${d.path}`, message: d.message })));
    return amount && currency ? { amount, currency } : undefined;
  }

  sku(path: string) {
    return this.string(path, { pattern: SKU_PATTERN });
  }

  throwIfInvalid(): void {
    if (this.details.length) throw validationFailed(this.details);
  }
}
