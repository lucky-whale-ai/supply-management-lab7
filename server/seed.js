import { sequelize } from "./database.js";
import { Product, Order, Shipment, ShipmentItem } from "./models.js";

const goods = [
  ["Болт М10", "0.12", "Крепёжный болт с метрической резьбой М10."],
  ["Болт М12", "0.16", "Крепёжный болт с метрической резьбой М12."],
  ["Гайка М10", "0.08", "Шестигранная гайка для соединений М10."],
  ["Гайка М12", "0.10", "Шестигранная гайка для соединений М12."],
  ["Шайба М10", "0.04", "Стальная плоская шайба для крепежа М10."],
  ["Шайба М12", "0.05", "Стальная плоская шайба для крепежа М12."],
  ["Труба стальная 20 мм", "1.25", "Стальная труба диаметром 20 мм."],
  ["Труба стальная 25 мм", "1.60", "Стальная труба диаметром 25 мм."],
  ["Труба стальная 32 мм", "2.10", "Стальная труба диаметром 32 мм."],
  ["Труба стальная 40 мм", "2.85", "Стальная труба диаметром 40 мм."],
];
const customers = [
  ["ООО «Строймонтаж»", "Минск, ул. Промышленная, 12", "+375 29 111-22-33"],
  ["ОАО «Механический завод»", "Могилёв, ул. Заводская, 8", "+375 29 222-33-44"],
  ["ООО «Техсервис»", "Гомель, ул. Техническая, 5", "+375 29 333-44-55"],
  ["ОАО «Энергострой»", "Витебск, ул. Энергетиков, 16", "+375 29 444-55-66"],
  ["ООО «Промснаб»", "Брест, ул. Индустриальная, 3", "+375 29 555-66-77"],
];

try {
  await sequelize.authenticate();
  await sequelize.sync();
  const populated = (await Promise.all([Product.count(), Order.count(), Shipment.count(), ShipmentItem.count()])).some(Boolean);
  if (populated) {
    console.log("База уже содержит данные. Повторное заполнение пропущено.");
  } else {
    await sequelize.transaction(async (transaction) => {
      const products = [];
      for (const [index, [name, price, description]] of goods.entries()) {
        products.push(await Product.create({ name, price, description, photo: index < 6 ? "/images/fasteners.jpg" : "/images/pipes.jpg" }, { transaction }));
      }
      const orders = [];
      for (let index = 0; index < 15; index++) {
        const [customerName, customerAddress, customerPhone] = customers[index % customers.length];
        orders.push(await Order.create({
          customerName, customerAddress, customerPhone, contractNumber: `ПР-2026-${String(index + 1).padStart(3, "0")}`,
          contractDate: `2026-${String(1 + index % 6).padStart(2, "0")}-10`,
          productId: products[index % products.length].id, plannedQuantity: 100 + index * 20,
        }, { transaction }));
      }
      const shipments = [];
      for (let index = 0; index < 10; index++) {
        shipments.push(await Shipment.create({
          number: `ОТГ-2026-${String(index + 1).padStart(3, "0")}`,
          shippedAt: `2026-${String(7 + Math.floor(index / 5)).padStart(2, "0")}-${String(12 + index % 5).padStart(2, "0")}`,
          notes: index % 2 ? "Частичная поставка по договору." : "Поставка со склада завода.",
        }, { transaction }));
      }
      for (let index = 0; index < 25; index++) {
        await ShipmentItem.create({
          shipmentId: shipments[index % shipments.length].id,
          orderId: orders[index % orders.length].id,
          quantity: 20 + index * 3,
        }, { transaction });
      }
    });
    console.log("Добавлено 60 записей: 10 товаров, 15 заказов, 10 отгрузок и 25 позиций.");
  }
} catch (error) {
  console.error("Не удалось заполнить базу данных:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
