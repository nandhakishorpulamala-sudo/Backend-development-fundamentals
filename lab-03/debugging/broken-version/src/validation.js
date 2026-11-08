const { HttpError } = require("./middleware/errors");

const SORTABLE_COLUMNS = ["id", "title", "author", "price", "created_at"];
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function isBlank(value) {
  return typeof value !== "string" || value.trim() === "";
}

// Accepts 450, 450.5, "450", "450.5". Rejects "abc", "", null, true, NaN, Infinity.
function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : NaN;
  if (typeof value === "string" && value.trim() !== "") return Number(value);
  return NaN;
}

// Validates the body of POST / PUT. Returns clean values or throws 400.
function validateBookBody(body) {
  if (body === undefined || body === null || typeof body !== "object" || Array.isArray(body)) {
    throw new HttpError(400, "Request body must be a JSON object");
  }

  const missing = ["title", "author", "price"].filter(
    (f) => body[f] === undefined || body[f] === null || (f !== "price" && isBlank(body[f]))
  );
  if (missing.length > 0) {
    throw new HttpError(400, `Missing or empty required field(s): ${missing.join(", ")}`);
  }

  const price = toNumber(body.price);
  if (Number.isNaN(price)) throw new HttpError(400, "price must be a number");
  if (price < 0) throw new HttpError(400, "price must not be negative");

  return { title: body.title.trim(), author: body.author.trim(), price };
}

function parseIntParam(raw, name, { min, max }) {
  if (!/^-?\d+$/.test(String(raw))) {
    throw new HttpError(400, `${name} must be an integer`);
  }
  const n = Number(raw);
  if (n < min || (max !== undefined && n > max)) {
    throw new HttpError(
      400,
      max !== undefined ? `${name} must be between ${min} and ${max}` : `${name} must be ${min} or more`
    );
  }
  return n;
}

function parsePriceParam(raw, name) {
  const n = toNumber(raw);
  if (Number.isNaN(n) || n < 0) throw new HttpError(400, `${name} must be a non-negative number`);
  return n;
}

// Reads and validates the query string for GET /books. Applies defaults.
function parseListQuery(query) {
  const order_by = query.order_by === undefined ? "id" : String(query.order_by);
  if (!SORTABLE_COLUMNS.includes(order_by)) {
    throw new HttpError(400, `order_by must be one of: ${SORTABLE_COLUMNS.join(", ")}`);
  }

  const order = query.order === undefined ? "ASC" : String(query.order).toUpperCase();
  if (order !== "ASC" && order !== "DESC") {
    throw new HttpError(400, "order must be ASC or DESC");
  }

  const limit = query.limit === undefined ? DEFAULT_LIMIT : parseIntParam(query.limit, "limit", { min: 1, max: MAX_LIMIT });
  const offset = query.offset === undefined ? 0 : parseIntParam(query.offset, "offset", { min: 0 });

  const min_price = query.min_price === undefined ? undefined : parsePriceParam(query.min_price, "min_price");
  const max_price = query.max_price === undefined ? undefined : parsePriceParam(query.max_price, "max_price");
  if (min_price !== undefined && max_price !== undefined && min_price > max_price) {
    throw new HttpError(400, "min_price must not be greater than max_price");
  }

  const search_q = query.search_q === undefined ? "" : String(query.search_q).trim();

  return { search_q, order_by, order, limit, offset, min_price, max_price };
}

// Path parameter :id must be a positive integer.
function parseId(raw) {
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new HttpError(400, "id must be a positive integer");
  }
  return Number(raw);
}

module.exports = { validateBookBody, parseListQuery, parseId, SORTABLE_COLUMNS };
