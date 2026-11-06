import { ForeignKeyConstraintError, UniqueConstraintError, ValidationError } from "sequelize";

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  let status = error.status || 500;
  let message = error.message;

  if (error instanceof UniqueConstraintError) {
    status = 409;
    message = "Такая запись уже существует. Проверьте номер отгрузки или состав её позиций.";
  } else if (error instanceof ForeignKeyConstraintError) {
    status = 409;
    message = req.method === "DELETE"
      ? "Удалить запись нельзя: на неё ссылаются другие записи. Сначала удалите связанные данные."
      : "Связанная запись отсутствует или была изменена. Обновите данные и повторите действие.";
  } else if (error instanceof ValidationError) {
    status = 400;
    message = error.errors.map((item) => item.message).join(" ");
  } else if (error.type === "entity.parse.failed") {
    status = 400;
    message = "В теле запроса некорректный JSON.";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "Размер запроса превышает 32 КБ.";
  } else if (!error.status) {
    message = "Не удалось обработать запрос. Проверьте соединение с базой данных и повторите попытку.";
  }

  if (status >= 500) console.error(error.name, error.message);
  res.status(status).json({ error: message });
}
