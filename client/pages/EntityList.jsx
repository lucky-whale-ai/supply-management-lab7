import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { entities } from "../entities.js";
import { entitySlices } from "../store/store.js";
import { useLookups } from "../hooks/useLookups.js";
import { FormField } from "../components/FormField.jsx";
import { Notice } from "../components/Notice.jsx";
import { validateFilters } from "../validation.js";

export function EntityList({ resource }) {
  const config = entities[resource];
  const slice = entitySlices[resource];
  const dispatch = useDispatch();
  const state = useSelector((rootState) => rootState[resource]);
  const { lookups, lookupError, lookupLoading } = useLookups(config.lookupResources);
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const params = useMemo(() => ({
    page: searchParams.get("page") || "1",
    pageSize: searchParams.get("pageSize") || "10",
    sort: searchParams.get("sort") || "id",
    order: searchParams.get("order") || "asc",
    q: searchParams.get("q") || "",
    ...Object.fromEntries(config.filters.map((field) => [field.name, searchParams.get(field.name) || ""])),
  }), [searchParams, config]);
  const [draft, setDraft] = useState(params);
  const [filterError, setFilterError] = useState("");
  const [notice, setNotice] = useState(location.state?.notice || "");
  const returnTo = location.pathname + location.search;

  useEffect(() => {
    setDraft(params);
    const request = dispatch(slice.loadList(params));
    return () => request.abort();
  }, [dispatch, slice, params]);

  function changeParams(values) {
    setSearchParams(Object.fromEntries(Object.entries(values).filter(([, value]) => value !== "")));
  }

  function changeField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
    setFilterError("");
  }

  function applyFilters(event) {
    event.preventDefault();
    const error = validateFilters(draft);
    setFilterError(error);
    if (!error) changeParams({ ...draft, page: "1" });
  }

  async function removeRecord(record) {
    if (!window.confirm(`Удалить ${config.singular} №${record.id}?`)) return;
    setNotice("");
    try {
      await dispatch(slice.remove(record.id)).unwrap();
      setNotice("Запись удалена.");
      if (state.items.length === 1 && Number(params.page) > 1) {
        changeParams({ ...params, page: String(Number(params.page) - 1) });
      } else {
        await dispatch(slice.loadList(params));
      }
    } catch { /* Сообщение сервера хранится в Redux и выводится ниже. */ }
  }

  return (
    <section>
      <div className="page-heading">
        <div><p className="eyebrow">Поставка товаров</p><h1>{config.title}</h1><p className="page-description">{config.description}</p></div>
        <Link className="button" to={`/${resource}/new`} state={{ returnTo }}>Добавить {config.singular}</Link>
      </div>
      <Notice>{notice}</Notice>
      <Notice error>{state.error || lookupError || filterError}</Notice>

      <form className="panel filters-form" onSubmit={applyFilters}>
        <FormField field={{ name: "q", label: "Поиск по нескольким полям", maxLength: 200 }} value={draft.q} onChange={changeField} prefix="filter" />
        {config.filters.map((field) => <FormField key={field.name} field={field} value={draft[field.name]} onChange={changeField} lookups={lookups} prefix="filter" disabled={field.type === "select" && lookupLoading} />)}
        <div className="field">
          <label htmlFor="sort">Сортировка</label>
          <select id="sort" value={draft.sort} onChange={(event) => changeField("sort", event.target.value)}>
            {config.sortOptions.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="field">
          <label htmlFor="order">Порядок</label>
          <select id="order" value={draft.order} onChange={(event) => changeField("order", event.target.value)}><option value="asc">По возрастанию</option><option value="desc">По убыванию</option></select>
        </div>
        <div className="filter-actions">
          <button className="button" disabled={state.loading}>Применить</button>
          <button className="button button-secondary" type="button" onClick={() => { setFilterError(""); setNotice(""); setSearchParams({}); }}>Сбросить</button>
        </div>
      </form>

      <div className="list-toolbar"><p className="result-count" role="status">{state.loading ? "Загрузка…" : `Найдено записей: ${state.total}`}</p>
        <label className="page-size">На странице <select value={params.pageSize} onChange={(event) => changeParams({ ...params, pageSize: event.target.value, page: "1" })}><option value="5">5</option><option value="10">10</option><option value="20">20</option></select></label>
      </div>
      <div className="panel table-panel" aria-busy={state.loading}>
        <div className="table-scroll">
          <table>
            <thead><tr><th scope="col">№</th>{config.columns.map((column) => <th key={column.label} scope="col">{column.label}</th>)}<th scope="col">Действия</th></tr></thead>
            <tbody>
              {state.items.map((record) => <tr key={record.id}>
                <td>{record.id}</td>
                {config.columns.map((column) => <td key={column.label}>{column.value(record)}</td>)}
                <td><div className="row-actions">
                  <Link to={`/${resource}/${record.id}`} state={{ returnTo }}>Подробнее</Link>
                  <Link to={`/${resource}/${record.id}/edit`} state={{ returnTo }}>Изменить</Link>
                  <button className="text-button danger" disabled={state.saving || state.loading} onClick={() => removeRecord(record)} type="button">Удалить</button>
                </div></td>
              </tr>)}
            </tbody>
          </table>
        </div>
        {!state.loading && state.items.length === 0 && <p className="empty-message">Записей не найдено. Измените условия поиска или добавьте запись.</p>}
      </div>
      <nav className="pagination" aria-label="Страницы списка">
        <button className="button button-secondary" disabled={state.loading || Number(params.page) <= 1} onClick={() => changeParams({ ...params, page: String(Number(params.page) - 1) })}>Назад</button>
        <span>Страница {params.page} из {state.totalPages}</span>
        <button className="button button-secondary" disabled={state.loading || Number(params.page) >= state.totalPages} onClick={() => changeParams({ ...params, page: String(Number(params.page) + 1) })}>Далее</button>
      </nav>
    </section>
  );
}
