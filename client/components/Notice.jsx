export function Notice({ children, error = false }) {
  if (!children) return null;
  return <p className={`notice${error ? " notice-error" : ""}`} role={error ? "alert" : "status"}>{children}</p>;
}
