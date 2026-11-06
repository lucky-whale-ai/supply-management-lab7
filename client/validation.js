function isCalendarDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validateDraft(config, draft) {
  const errors = {};
  for (const field of config.fields) {
    const value = String(draft[field.name] ?? "").trim();
    if (field.required && !value) {
      errors[field.name] = "Заполните поле.";
    } else if (field.maxLength && value.length > field.maxLength) {
      errors[field.name] = `Не более ${field.maxLength} символов.`;
    } else if (value && field.type === "date" && !isCalendarDate(value)) {
      errors[field.name] = "Укажите существующую дату.";
    } else if (value && (field.type === "select" || field.step === "1")) {
      if (!/^[1-9]\d*$/.test(value) || Number(value) > 2147483647) {
        errors[field.name] = "Укажите положительное целое число до 2147483647.";
      }
    } else if (field.name === "price" && (!/^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(value) || Number(value) <= 0)) {
      errors[field.name] = "Цена должна быть больше нуля, до двух знаков после точки.";
    } else if (field.type === "tel" && (!/^\+?[\d ()-]+$/.test(value) || value.replace(/\D/g, "").length < 7)) {
      errors[field.name] = "Укажите минимум 7 цифр; допустимы +, пробелы, скобки и дефисы.";
    } else if (field.name === "photo") {
      let valid = /^\/images\/[A-Za-z0-9._-]+\.(svg|png|jpe?g|webp)$/i.test(value);
      try { valid ||= new URL(value).protocol === "https:"; } catch { /* Проверяем локальный путь выше. */ }
      if (!valid) errors[field.name] = "Укажите путь к изображению в /images/ или ссылку HTTPS.";
    }
  }
  return errors;
}

export function validateFilters(values) {
  if (values.minPrice && values.maxPrice && Number(values.minPrice) > Number(values.maxPrice)) {
    return "Минимальная цена не должна превышать максимальную.";
  }
  if (values.minQuantity && values.maxQuantity && Number(values.minQuantity) > Number(values.maxQuantity)) {
    return "Минимальное количество не должно превышать максимальное.";
  }
  if (values.dateFrom && values.dateTo && values.dateFrom > values.dateTo) {
    return "Начало периода не должно быть позже его окончания.";
  }
  return "";
}
