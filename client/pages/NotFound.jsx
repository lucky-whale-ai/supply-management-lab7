import { Link } from "react-router-dom";

export function NotFound() {
  return <section className="panel empty-page"><p className="eyebrow">404</p><h1>Страница не найдена</h1><p>Проверьте адрес или вернитесь к списку товаров.</p><Link className="button" to="/products">К товарам</Link></section>;
}
