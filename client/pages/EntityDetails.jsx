import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { entities } from "../entities.js";
import { errorMessage, loadOptions } from "../api.js";
import { entitySlices } from "../store/store.js";
import { Notice } from "../components/Notice.jsx";
import { ProductPhoto } from "../components/ProductPhoto.jsx";

export function EntityDetails({ resource }) {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const config = entities[resource];
  const slice = entitySlices[resource];
  const state = useSelector((rootState) => rootState[resource]);
  const record = state.current?.id === Number(id) ? state.current : null;
  const returnTo = location.state?.returnTo || `/${resource}`;
  const [positions, setPositions] = useState([]);
  const [positionsError, setPositionsError] = useState("");
  const [positionsLoading, setPositionsLoading] = useState(false);

  useEffect(() => {
    const request = dispatch(slice.loadOne(id));
    return () => request.abort();
  }, [dispatch, slice, id]);
  useEffect(() => {
    if (resource !== "shipments") return;
    let active = true;
    setPositions([]);
    setPositionsLoading(true);
    setPositionsError("");
    loadOptions("shipment-items", { shipmentId: id })
      .then((items) => { if (active) setPositions(items); })
      .catch((error) => { if (active) setPositionsError(errorMessage(error)); })
      .finally(() => { if (active) setPositionsLoading(false); });
    return () => { active = false; };
  }, [resource, id]);

  async function removeRecord() {
    if (!window.confirm(`Удалить ${config.singular} №${id}?`)) return;
    try {
      await dispatch(slice.remove(id)).unwrap();
      navigate(returnTo, { state: { notice: "Запись удалена." } });
    } catch { /* Ошибку удаления показывает Notice. */ }
  }

  const product = resource === "products" ? record
    : record?.product || record?.order?.product || positions[0]?.order?.product;
  return (
    <section>
      <Link className="back-link" to={returnTo}>← {config.title}</Link>
      <div className="page-heading"><div><p className="eyebrow">{config.title}</p><h1>Запись №{id}</h1></div></div>
      <Notice error>{state.error || positionsError}</Notice>
      {state.detailLoading ? <p className="panel">Загрузка записи…</p> : !record ? <p className="panel">Запись недоступна. Проверьте адрес или вернитесь к списку.</p> : (
        <>
          <div className="panel details-layout">
            <div>
              <h2>{record.name || record.number || record.contractNumber || "Сведения о позиции"}</h2>
              <dl className="details-list">{config.details.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value(record)}</dd></div>)}</dl>
              <div className="form-actions"><Link className="button" to={`/${resource}/${id}/edit`} state={{ returnTo }}>Изменить</Link><button className="button button-danger" disabled={state.saving} onClick={removeRecord}>Удалить</button></div>
            </div>
            <aside className="details-photo">
              {positionsLoading ? <p>Загрузка состава отгрузки…</p> : product ? <><ProductPhoto src={product.photo} name={product.name} /><p>{product.name}</p></> : <p className="photo-placeholder">В отгрузке пока нет товаров</p>}
            </aside>
          </div>
          {resource === "shipments" && <section className="panel shipment-content">
            <div className="section-heading"><h2>Состав отгрузки</h2><Link to="/shipment-items/new" className="button button-secondary" state={{ returnTo: `/${resource}/${id}` }}>Добавить позицию</Link></div>
            {!positionsLoading && positions.length === 0 && <p>Позиций пока нет.</p>}
            <ul className="shipment-positions">{positions.map((position) => <li key={position.id}><Link to={`/shipment-items/${position.id}`} state={{ returnTo: `/${resource}/${id}` }}>{position.order?.product?.name || `Заказ №${position.orderId}`}</Link><span>{position.order?.contractNumber} · {position.order?.customerName}</span><strong>{position.quantity} шт.</strong></li>)}</ul>
          </section>}
        </>
      )}
    </section>
  );
}
