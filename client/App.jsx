import { NavLink, Navigate, Route, Routes } from "react-router-dom";
import { entities } from "./entities.js";
import { EntityList } from "./pages/EntityList.jsx";
import { EntityForm } from "./pages/EntityForm.jsx";
import { EntityDetails } from "./pages/EntityDetails.jsx";
import { NotFound } from "./pages/NotFound.jsx";

export function App() {
  return (
    <>
      <header className="site-header">
        <div className="container header-content">
          <NavLink to="/products" className="brand">ПРОГРЕСС<span>Завод · поставка товаров</span></NavLink>
          <nav className="main-nav" aria-label="Разделы приложения">
            {Object.entries(entities).map(([resource, config]) => (
              <NavLink key={resource} to={`/${resource}`}>{config.title}</NavLink>
            ))}
          </nav>
        </div>
      </header>
      <main className="container main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/products" replace />} />
          {Object.keys(entities).map((resource) => (
            <Route key={resource}>
              <Route path={`/${resource}`} element={<EntityList key={resource} resource={resource} />} />
              <Route path={`/${resource}/new`} element={<EntityForm key={`${resource}-new`} resource={resource} />} />
              <Route path={`/${resource}/:id/edit`} element={<EntityForm key={`${resource}-edit`} resource={resource} />} />
              <Route path={`/${resource}/:id`} element={<EntityDetails key={resource} resource={resource} />} />
            </Route>
          ))}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <footer className="site-footer"><div className="container">Завод «Прогресс» · Учёт заказов и отгрузок</div></footer>
    </>
  );
}
