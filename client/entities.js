export const formatDate = (value) => value ? String(value).slice(0, 10).split("-").reverse().join(".") : "—";
export const formatPrice = (value) => Number(value).toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const optionLabel = (resource, item) => {
  if (resource === "products") return item.name;
  if (resource === "orders") return `${item.contractNumber} — ${item.customerName}`;
  return `${item.number} от ${formatDate(item.shippedAt)}`;
};

export const entities = {
  products: {
    title: "Товары", singular: "товар", description: "Номенклатура завода, цены и сведения об изделиях.",
    lookupResources: [],
    fields: [
      { name: "name", label: "Название товара", required: true, maxLength: 120 },
      { name: "price", label: "Цена, тыс. руб.", type: "number", required: true, min: "0.01", step: "0.01" },
      { name: "photo", label: "Адрес фотографии", required: true, maxLength: 500, initial: "/images/fasteners.jpg", hint: "Например, /images/fasteners.jpg или ссылка https://…" },
      { name: "description", label: "Описание", type: "textarea", maxLength: 1000 },
    ],
    filters: [
      { name: "name", label: "Название", maxLength: 120 },
      { name: "minPrice", label: "Цена от", type: "number", min: "0", step: "0.01" },
      { name: "maxPrice", label: "Цена до", type: "number", min: "0", step: "0.01" },
    ],
    sortOptions: [["id", "Номер"], ["name", "Название"], ["price", "Цена"]],
    columns: [
      { label: "Товар", value: (item) => item.name },
      { label: "Цена, тыс. руб.", value: (item) => formatPrice(item.price) },
    ],
    details: [
      ["Название", (item) => item.name], ["Цена, тыс. руб.", (item) => formatPrice(item.price)],
      ["Описание", (item) => item.description || "Описание не заполнено"],
    ],
  },
  orders: {
    title: "Заказы", singular: "заказ", description: "Заказчики, договоры и плановые объёмы поставок.",
    lookupResources: ["products"],
    fields: [
      { name: "customerName", label: "Заказчик", required: true, maxLength: 150 },
      { name: "customerAddress", label: "Адрес заказчика", required: true, maxLength: 250 },
      { name: "customerPhone", label: "Телефон заказчика", type: "tel", required: true, maxLength: 25 },
      { name: "contractNumber", label: "Номер договора", required: true, maxLength: 40 },
      { name: "contractDate", label: "Дата договора", type: "date", required: true },
      { name: "productId", label: "Товар", type: "select", resource: "products", required: true },
      { name: "plannedQuantity", label: "Плановая поставка, шт.", type: "number", required: true, min: "1", step: "1" },
    ],
    filters: [
      { name: "productId", label: "Товар", type: "select", resource: "products" },
      { name: "customerName", label: "Заказчик", maxLength: 150 },
      { name: "dateFrom", label: "Договор с", type: "date" },
      { name: "dateTo", label: "Договор по", type: "date" },
    ],
    sortOptions: [["id", "Номер"], ["customerName", "Заказчик"], ["contractDate", "Дата договора"], ["plannedQuantity", "Количество"]],
    columns: [
      { label: "Договор / заказчик", value: (item) => `${item.contractNumber} · ${item.customerName}` },
      { label: "Товар", value: (item) => item.product?.name || `№${item.productId}` },
      { label: "План, шт.", value: (item) => item.plannedQuantity },
      { label: "Дата", value: (item) => formatDate(item.contractDate) },
    ],
    details: [
      ["Заказчик", (item) => item.customerName], ["Адрес", (item) => item.customerAddress],
      ["Телефон", (item) => item.customerPhone], ["Договор", (item) => item.contractNumber],
      ["Дата договора", (item) => formatDate(item.contractDate)],
      ["Товар", (item) => item.product?.name || `№${item.productId}`],
      ["Плановая поставка, шт.", (item) => item.plannedQuantity],
    ],
  },
  shipments: {
    title: "Отгрузки", singular: "отгрузку", description: "Документы отгрузки и даты передачи товаров.",
    lookupResources: [],
    fields: [
      { name: "number", label: "Номер отгрузки", required: true, maxLength: 40 },
      { name: "shippedAt", label: "Дата отгрузки", type: "date", required: true },
      { name: "notes", label: "Примечание", type: "textarea", maxLength: 1000 },
    ],
    filters: [
      { name: "number", label: "Номер отгрузки", maxLength: 40 },
      { name: "dateFrom", label: "Дата с", type: "date" },
      { name: "dateTo", label: "Дата по", type: "date" },
    ],
    sortOptions: [["id", "Номер записи"], ["number", "Номер отгрузки"], ["shippedAt", "Дата отгрузки"]],
    columns: [
      { label: "Отгрузка", value: (item) => item.number },
      { label: "Дата", value: (item) => formatDate(item.shippedAt) },
      { label: "Примечание", value: (item) => item.notes || "—" },
    ],
    details: [
      ["Номер отгрузки", (item) => item.number], ["Дата отгрузки", (item) => formatDate(item.shippedAt)],
      ["Примечание", (item) => item.notes || "Примечание не заполнено"],
    ],
  },
  "shipment-items": {
    title: "Позиции отгрузок", singular: "позицию", description: "Заказы и фактические количества товаров в каждой отгрузке.",
    lookupResources: ["shipments", "orders"],
    fields: [
      { name: "shipmentId", label: "Отгрузка", type: "select", resource: "shipments", required: true },
      { name: "orderId", label: "Заказ", type: "select", resource: "orders", required: true },
      { name: "quantity", label: "Отгружено, шт.", type: "number", required: true, min: "1", step: "1" },
    ],
    filters: [
      { name: "shipmentId", label: "Отгрузка", type: "select", resource: "shipments" },
      { name: "orderId", label: "Заказ", type: "select", resource: "orders" },
      { name: "minQuantity", label: "Количество от", type: "number", min: "1", step: "1" },
      { name: "maxQuantity", label: "Количество до", type: "number", min: "1", step: "1" },
    ],
    sortOptions: [["id", "Номер"], ["quantity", "Количество"]],
    columns: [
      { label: "Отгрузка", value: (item) => item.shipment?.number || `№${item.shipmentId}` },
      { label: "Договор / заказчик", value: (item) => item.order ? `${item.order.contractNumber} · ${item.order.customerName}` : `№${item.orderId}` },
      { label: "Товар", value: (item) => item.order?.product?.name || "—" },
      { label: "Отгружено, шт.", value: (item) => item.quantity },
    ],
    details: [
      ["Отгрузка", (item) => item.shipment?.number || `№${item.shipmentId}`],
      ["Дата отгрузки", (item) => formatDate(item.shipment?.shippedAt)],
      ["Заказчик", (item) => item.order?.customerName || "—"],
      ["Договор", (item) => item.order?.contractNumber || `№${item.orderId}`],
      ["Товар", (item) => item.order?.product?.name || "—"], ["Отгружено, шт.", (item) => item.quantity],
    ],
  },
};

export function initialDraft(config, record) {
  return Object.fromEntries(config.fields.map((field) => [field.name, record?.[field.name] ?? field.initial ?? ""]));
}
