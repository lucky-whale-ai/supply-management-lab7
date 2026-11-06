import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { entities, initialDraft } from "../entities.js";
import { entitySlices } from "../store/store.js";
import { useLookups } from "../hooks/useLookups.js";
import { FormField } from "../components/FormField.jsx";
import { Notice } from "../components/Notice.jsx";
import { validateDraft } from "../validation.js";

export function EntityForm({ resource }) {
  const { id } = useParams();
  const config = entities[resource];
  const slice = entitySlices[resource];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || `/${resource}`;
  const state = useSelector((rootState) => rootState[resource]);
  const record = id && state.current?.id === Number(id) ? state.current : null;
  const { lookups, lookupError, lookupLoading } = useLookups(config.lookupResources);
  const [draft, setDraft] = useState(() => initialDraft(config));
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    dispatch(slice.actions.clearError());
    if (!id) return;
    const request = dispatch(slice.loadOne(id));
    return () => request.abort();
  }, [dispatch, slice, id]);
  useEffect(() => {
    if (record) setDraft(initialDraft(config, record));
  }, [record, config]);

  function changeField(name, value) {
    setDraft((current) => ({ ...current, [name]: value }));
    setFieldErrors((current) => ({ ...current, [name]: "" }));
    dispatch(slice.actions.clearError());
  }

  async function save(event) {
    event.preventDefault();
    const errors = validateDraft(config, draft);
    setFieldErrors(errors);
    if (Object.keys(errors).length) return;
    const values = Object.fromEntries(Object.entries(draft).map(([name, value]) => [name, String(value).trim()]));
    try {
      await dispatch(slice.save({ id, values })).unwrap();
      navigate(returnTo, { state: { notice: id ? "Изменения сохранены." : "Запись добавлена." } });
    } catch { /* При ошибке остаёмся в форме и сохраняем введённые данные. */ }
  }

  const waiting = Boolean(id) && (state.detailLoading || !record);
  return (
    <section>
      <Link className="back-link" to={returnTo}>← {config.title}</Link>
      <div className="page-heading"><div><p className="eyebrow">{config.title}</p><h1>{id ? `Изменить ${config.singular}` : `Добавить ${config.singular}`}</h1><p className="page-description">Обязательные поля отмечены звёздочкой.</p></div></div>
      <Notice error>{state.error || lookupError}</Notice>
      {waiting ? <p className="panel">{state.detailLoading ? "Загрузка записи…" : "Запись недоступна. Проверьте адрес или вернитесь к списку."}</p> : (
        <form className="panel edit-form" onSubmit={save} noValidate>
          <fieldset disabled={state.saving || lookupLoading}>
            <legend className="visually-hidden">Данные записи</legend>
            <div className="form-grid">
              {config.fields.map((field) => <FormField key={field.name} field={field} value={draft[field.name]} onChange={changeField} lookups={lookups} error={fieldErrors[field.name]} />)}
            </div>
            <div className="form-actions"><button className="button" type="submit">{state.saving ? "Сохранение…" : "Сохранить"}</button><Link className="button button-secondary" to={returnTo}>Отмена</Link></div>
          </fieldset>
        </form>
      )}
    </section>
  );
}
