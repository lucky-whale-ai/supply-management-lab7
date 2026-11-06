import { httpError } from "./errors.js";

export function isCalendarDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function positiveInteger(value, label = "ID") {
  if ((typeof value !== "number" && typeof value !== "string")
      || !/^[1-9]\d*$/.test(String(value))) {
    throw httpError(400, `${label}: укажите положительное целое число.`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number > 2147483647) {
    throw httpError(400, `${label}: число превышает допустимый диапазон.`);
  }
  return number;
}

// Берём только поля формы: ID и имена служебных полей клиент не задаёт.
export function normalizeBody(body, fields) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Передайте JSON-объект с данными формы.");
  }
  const unknown = Object.keys(body).find((name) => !Object.hasOwn(fields, name));
  if (unknown) throw httpError(400, `Неизвестное поле: ${unknown}.`);

  const values = {};
  for (const [name, field] of Object.entries(fields)) {
    const value = body[name];
    if (value === undefined || value === null) {
      values[name] = field.optional ? "" : null;
    } else if (field.type === "integer") {
      values[name] = positiveInteger(value, field.label);
    } else if (field.type === "money") {
      if ((typeof value !== "number" && typeof value !== "string") || !String(value).trim()) {
        throw httpError(400, `Поле «${field.label}» должно содержать цену.`);
      }
      values[name] = String(value).trim();
    } else {
      if (typeof value !== "string") {
        throw httpError(400, `Поле «${field.label}» должно содержать текст.`);
      }
      values[name] = value.trim();
      if (!values[name].isWellFormed() || values[name].includes("\0")) {
        throw httpError(400, `Поле «${field.label}» содержит недопустимые символы.`);
      }
      if (field.type === "date" && !isCalendarDate(values[name])) {
        throw httpError(400, `Поле «${field.label}»: укажите существующую дату в формате ГГГГ-ММ-ДД.`);
      }
    }
  }
  return values;
}
