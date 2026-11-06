import { DataTypes } from "sequelize";
import { sequelize } from "./database.js";
import { isCalendarDate } from "./validation.js";

function textField(label, limit, optional = false) {
  return {
    type: DataTypes.STRING(limit),
    allowNull: false,
    ...(optional ? { defaultValue: "" } : {}),
    validate: {
      notNull: { msg: `Заполните поле «${label}».` },
      ...(!optional ? { notEmpty: { msg: `Заполните поле «${label}».` } } : {}),
      len: { args: [optional ? 0 : 1, limit], msg: `Поле «${label}»: не более ${limit} символов.` },
    },
  };
}

function integerField(label) {
  return {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: `Заполните поле «${label}».` },
      isInt: { msg: `Поле «${label}» должно быть целым числом.` },
      min: { args: [1], msg: `Поле «${label}» должно быть больше нуля.` },
      max: { args: [2147483647], msg: `Поле «${label}»: слишком большое число.` },
    },
  };
}

function dateField(label) {
  return {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      notNull: { msg: `Заполните поле «${label}».` },
      isDate: { msg: `В поле «${label}» указана неверная дата.` },
      calendarDate(value) {
        if (!isCalendarDate(value)) throw new Error(`В поле «${label}» указана несуществующая дата.`);
      },
    },
  };
}

export const Product = sequelize.define("Product", {
  name: textField("Название товара", 120),
  price: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    validate: {
      notNull: { msg: "Укажите цену товара." },
      isDecimal: { msg: "Цена должна быть числом." },
      min: { args: [0.01], msg: "Цена должна быть больше нуля." },
      moneyFormat(value) {
        if (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(String(value))) {
          throw new Error("Цена: до 10 цифр перед точкой и до 2 после неё.");
        }
      },
    },
  },
  photo: {
    ...textField("Фотография", 500),
    validate: {
      notNull: { msg: "Укажите фотографию товара." },
      notEmpty: { msg: "Укажите фотографию товара." },
      len: { args: [1, 500], msg: "Ссылка на фотографию слишком длинная." },
      imageAddress(value) {
        const local = /^\/images\/[A-Za-z0-9._-]+\.(?:svg|png|jpe?g|webp)$/i.test(value);
        let remote = false;
        try { remote = new URL(value).protocol === "https:"; } catch { /* Локальный путь проверяется отдельно. */ }
        if (!local && !remote) throw new Error("Фотография: путь /images/имя.svg или ссылка HTTPS.");
      },
    },
  },
  description: textField("Описание", 1000, true),
}, { tableName: "products" });

export const Order = sequelize.define("Order", {
  customerName: textField("Заказчик", 150),
  customerAddress: textField("Адрес заказчика", 250),
  customerPhone: {
    ...textField("Телефон", 25),
    validate: {
      notNull: { msg: "Укажите телефон заказчика." },
      len: { args: [7, 25], msg: "Телефон должен содержать от 7 до 25 символов." },
      phoneNumber(value) {
        if (!/^\+?[\d ()-]+$/.test(value) || value.replace(/\D/g, "").length < 7) {
          throw new Error("В телефоне нужны минимум 7 цифр; допустимы +, пробелы, скобки и дефисы.");
        }
      },
    },
  },
  contractNumber: textField("Номер договора", 40),
  contractDate: dateField("Дата договора"),
  productId: integerField("Товар"),
  plannedQuantity: integerField("Плановая поставка"),
}, { tableName: "orders", indexes: [{ fields: ["productId"] }, { fields: ["contractDate"] }] });

export const Shipment = sequelize.define("Shipment", {
  number: { ...textField("Номер отгрузки", 40), unique: true },
  shippedAt: dateField("Дата отгрузки"),
  notes: textField("Примечание", 1000, true),
}, { tableName: "shipments", indexes: [{ fields: ["shippedAt"] }] });

export const ShipmentItem = sequelize.define("ShipmentItem", {
  shipmentId: integerField("Отгрузка"),
  orderId: integerField("Заказ"),
  quantity: integerField("Отгруженное количество"),
}, {
  tableName: "shipment_items",
  indexes: [{ unique: true, fields: ["shipmentId", "orderId"] }, { fields: ["orderId"] }],
});

const reference = (name) => ({ foreignKey: { name, allowNull: false }, onDelete: "RESTRICT", onUpdate: "CASCADE" });
Product.hasMany(Order, { ...reference("productId"), as: "orders" });
Order.belongsTo(Product, { ...reference("productId"), as: "product" });
Order.hasMany(ShipmentItem, { ...reference("orderId"), as: "shipmentItems" });
ShipmentItem.belongsTo(Order, { ...reference("orderId"), as: "order" });
Shipment.hasMany(ShipmentItem, { ...reference("shipmentId"), as: "items" });
ShipmentItem.belongsTo(Shipment, { ...reference("shipmentId"), as: "shipment" });
