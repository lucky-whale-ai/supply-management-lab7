import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { sequelize } from "./database.js";
import { api } from "./routes.js";
import { errorHandler, httpError } from "./errors.js";

const app = express();
const publicDir = fileURLToPath(new URL("../public/", import.meta.url));
app.disable("x-powered-by");
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (["POST", "PUT"].includes(req.method) && !req.is("application/json")) {
    return next(httpError(415, "Передайте данные с заголовком Content-Type: application/json."));
  }
  next();
});
app.use(express.json({ limit: "32kb" }));
app.use("/api", api);
app.use(express.static(publicDir));
app.get(/.*/, (req, res) => res.sendFile(path.join(publicDir, "index.html")));
app.use(errorHandler);

const port = Number(process.env.PORT || 3007);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("PORT должен быть от 1 до 65535.");
try {
  await sequelize.authenticate();
  await sequelize.sync();
  const server = app.listen(port, "127.0.0.1", () => console.log(`Прогресс: http://127.0.0.1:${port}`));
  server.on("error", async (error) => {
    console.error(error.code === "EADDRINUSE" ? `Порт ${port} уже занят.` : "Не удалось запустить HTTP-сервер.");
    await sequelize.close();
    process.exitCode = 1;
  });
  const stop = () => server.close(async () => { await sequelize.close(); process.exitCode = 0; });
  process.once("SIGINT", stop);
  process.once("SIGTERM", stop);
} catch (error) {
  console.error("Не удалось подключиться к PostgreSQL. Проверьте параметры .env и запуск базы данных.");
  console.error(error.name);
  await sequelize.close();
  process.exitCode = 1;
}
