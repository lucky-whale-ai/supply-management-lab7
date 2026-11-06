import { Router } from "express";
import { Product, Order, Shipment, ShipmentItem } from "./models.js";
import { httpError } from "./errors.js";
import { normalizeBody, positiveInteger } from "./validation.js";
import { listOptions } from "./query.js";

const orderInclude = [{ model: Product, as: "product" }];
const itemInclude = [{ model: Shipment, as: "shipment" }, { model: Order, as: "order", include: orderInclude }];
const resources = {
  products: {
    model: Product,
    fields: {
      name: { label: "Название товара" }, price: { type: "money", label: "Цена" },
      photo: { label: "Фотография" }, description: { label: "Описание", optional: true },
    },
  },
  orders: {
    model: Order, include: orderInclude,
    fields: {
      customerName: { label: "Заказчик" }, customerAddress: { label: "Адрес" },
      customerPhone: { label: "Телефон" }, contractNumber: { label: "Номер договора" },
      contractDate: { type: "date", label: "Дата договора" },
      productId: { type: "integer", label: "Товар" }, plannedQuantity: { type: "integer", label: "Плановая поставка" },
    },
    references: [["productId", Product, "Товар"]],
  },
  shipments: {
    model: Shipment,
    fields: {
      number: { label: "Номер отгрузки" }, shippedAt: { type: "date", label: "Дата отгрузки" },
      notes: { label: "Примечание", optional: true },
    },
    detailInclude: [{ model: ShipmentItem, as: "items", include: [{ model: Order, as: "order", include: orderInclude }] }],
  },
  "shipment-items": {
    model: ShipmentItem, include: itemInclude,
    fields: {
      shipmentId: { type: "integer", label: "Отгрузка" }, orderId: { type: "integer", label: "Заказ" },
      quantity: { type: "integer", label: "Количество" },
    },
    references: [["shipmentId", Shipment, "Отгрузка"], ["orderId", Order, "Заказ"]],
  },
};

async function requireRecord(config, id, detailed = false) {
  const record = await config.model.findByPk(id, { include: detailed ? config.detailInclude || config.include : config.include });
  if (!record) throw httpError(404, "Запись с таким ID не найдена.");
  return record;
}

async function checkReferences(config, values) {
  for (const [field, model, label] of config.references || []) {
    if (values[field] !== null && !await model.findByPk(values[field], { attributes: ["id"] })) {
      throw httpError(409, `${label} с таким ID не существует.`);
    }
  }
}

// У четырёх сущностей одинаковые HTTP-операции; поля и связи задаются выше.
export const api = Router();
api.get("/health", (req, res) => res.json({ status: "ok" }));
for (const [resource, config] of Object.entries(resources)) {
  const router = Router();
  router.get("/", async (req, res) => {
    const { page, pageSize, ...options } = listOptions(resource, req.query);
    const result = await config.model.findAndCountAll({ ...options, include: config.include, subQuery: false });
    res.json({ items: result.rows, total: result.count, page, pageSize, totalPages: Math.max(1, Math.ceil(result.count / pageSize)) });
  });
  router.get("/:id/exists", async (req, res) => {
    const record = await config.model.findByPk(positiveInteger(req.params.id), { attributes: ["id"] });
    res.json({ exists: Boolean(record) });
  });
  router.get("/:id", async (req, res) => res.json(await requireRecord(config, positiveInteger(req.params.id), true)));
  router.post("/", async (req, res) => {
    const values = normalizeBody(req.body, config.fields);
    await checkReferences(config, values);
    const record = await config.model.create(values);
    res.status(201).json(await requireRecord(config, record.id, true));
  });
  router.put("/:id", async (req, res) => {
    const record = await requireRecord(config, positiveInteger(req.params.id));
    const values = normalizeBody(req.body, config.fields);
    await checkReferences(config, values);
    await record.update(values);
    res.json(await requireRecord(config, record.id, true));
  });
  router.delete("/:id", async (req, res) => {
    const record = await requireRecord(config, positiveInteger(req.params.id));
    await record.destroy();
    res.status(204).end();
  });
  api.use(`/${resource}`, router);
}
api.use((req, res) => res.status(404).json({ error: "Сервис не найден." }));
