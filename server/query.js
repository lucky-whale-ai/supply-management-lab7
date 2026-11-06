import { Op } from "sequelize";
import { httpError } from "./errors.js";
import { isCalendarDate, positiveInteger } from "./validation.js";

const options = {
  products: { sorts: ["id", "name", "price"], filters: ["name", "minPrice", "maxPrice"] },
  orders: { sorts: ["id", "customerName", "contractDate", "plannedQuantity"], filters: ["productId", "customerName", "dateFrom", "dateTo"] },
  shipments: { sorts: ["id", "number", "shippedAt"], filters: ["number", "dateFrom", "dateTo"] },
  "shipment-items": { sorts: ["id", "quantity"], filters: ["shipmentId", "orderId", "minQuantity", "maxQuantity"] },
};

function text(query, name, limit = 200) {
  const value = query[name] ?? "";
  if (typeof value !== "string" || value.length > limit || !value.isWellFormed() || value.includes("\0")) {
    throw httpError(400, `Параметр ${name} должен быть строкой не длиннее ${limit} символов.`);
  }
  return value.trim();
}

function contains(value) {
  // Проценты и подчёркивания пользователя считаются буквальным текстом.
  return { [Op.iLike]: `%${value.replace(/[\\%_]/g, "\\$&")}%` };
}

function numberBound(query, name, integer = false) {
  const value = text(query, name, 30);
  if (!value) return undefined;
  if (integer) return positiveInteger(value, name);
  if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value)) {
    throw httpError(400, `${name}: укажите неотрицательную цену с точностью до двух знаков.`);
  }
  return Number(value);
}

function range(minimum, maximum, label) {
  if (minimum !== undefined && maximum !== undefined && minimum > maximum) {
    throw httpError(400, `${label}: нижняя граница не должна превышать верхнюю.`);
  }
  const result = {};
  if (minimum !== undefined) result[Op.gte] = minimum;
  if (maximum !== undefined) result[Op.lte] = maximum;
  return minimum !== undefined || maximum !== undefined ? result : null;
}

function dateBounds(query) {
  const from = text(query, "dateFrom", 10);
  const to = text(query, "dateTo", 10);
  if ((from && !isCalendarDate(from)) || (to && !isCalendarDate(to))) {
    throw httpError(400, "Границы периода должны быть существующими датами ГГГГ-ММ-ДД.");
  }
  return range(from || undefined, to || undefined, "Период");
}

export function listOptions(resource, query) {
  const config = options[resource];
  const allowed = ["page", "pageSize", "sort", "order", "q", ...config.filters];
  const unknown = Object.keys(query).find((name) => !allowed.includes(name));
  if (unknown) throw httpError(400, `Неизвестный параметр: ${unknown}.`);
  const page = positiveInteger(text(query, "page", 10) || "1", "Номер страницы");
  const pageSize = positiveInteger(text(query, "pageSize", 3) || "10", "Размер страницы");
  if (pageSize > 100) throw httpError(400, "Размер страницы должен быть от 1 до 100.");
  const offset = (page - 1) * pageSize;
  if (!Number.isSafeInteger(offset) || offset > 2147483647) throw httpError(400, "Номер страницы слишком большой.");
  const sort = text(query, "sort", 30) || "id";
  const direction = (text(query, "order", 4) || "asc").toLowerCase();
  if (!config.sorts.includes(sort)) throw httpError(400, "Выбрано недопустимое поле сортировки.");
  if (!["asc", "desc"].includes(direction)) throw httpError(400, "Порядок сортировки: asc или desc.");
  const where = {};
  const search = text(query, "q");

  if (resource === "products") {
    const name = text(query, "name", 120);
    if (name) where.name = contains(name);
    const price = range(numberBound(query, "minPrice"), numberBound(query, "maxPrice"), "Цена");
    if (price) where.price = price;
    if (search) where[Op.or] = [{ name: contains(search) }, { description: contains(search) }];
  } else if (resource === "orders") {
    const product = text(query, "productId", 10);
    const customer = text(query, "customerName", 150);
    if (product) where.productId = positiveInteger(product, "Товар");
    if (customer) where.customerName = contains(customer);
    const dates = dateBounds(query);
    if (dates) where.contractDate = dates;
    if (search) where[Op.or] = ["customerName", "contractNumber", "customerAddress"].map((name) => ({ [name]: contains(search) }));
  } else if (resource === "shipments") {
    const number = text(query, "number", 40);
    if (number) where.number = contains(number);
    const dates = dateBounds(query);
    if (dates) where.shippedAt = dates;
    if (search) where[Op.or] = [{ number: contains(search) }, { notes: contains(search) }];
  } else {
    for (const name of ["shipmentId", "orderId"]) {
      const value = text(query, name, 10);
      if (value) where[name] = positiveInteger(value, name);
    }
    const quantity = range(numberBound(query, "minQuantity", true), numberBound(query, "maxQuantity", true), "Количество");
    if (quantity) where.quantity = quantity;
    if (search) where[Op.or] = ["$order.contractNumber$", "$order.customerName$", "$shipment.number$"].map((name) => ({ [name]: contains(search) }));
  }

  const order = [[sort, direction.toUpperCase()]];
  if (sort !== "id") order.push(["id", "ASC"]);
  return { page, pageSize, where, order, limit: pageSize, offset };
}
