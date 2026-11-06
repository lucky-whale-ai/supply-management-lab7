import axios from "axios";

export const api = axios.create({ baseURL: "/api", timeout: 10000 });

export const errorMessage = (error) => error.response?.data?.error || "Не удалось выполнить запрос. Проверьте соединение и повторите попытку.";

export async function loadOptions(resource, filters = {}) {
  const items = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get(`/${resource}`, { params: { ...filters, page, pageSize: 100 } });
    items.push(...response.data.items);
    totalPages = response.data.totalPages;
    page += 1;
  } while (page <= totalPages);
  return items;
}
