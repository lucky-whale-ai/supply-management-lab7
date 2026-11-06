import { optionLabel } from "../entities.js";

export function FormField({ field, value, onChange, lookups = {}, error, prefix = "field", disabled = false }) {
  const id = `${prefix}-${field.name}`;
  const common = {
    id, name: field.name, value: value ?? "", disabled,
    required: field.required, maxLength: field.maxLength,
    "aria-invalid": Boolean(error), "aria-describedby": error ? `${id}-error` : field.hint ? `${id}-hint` : undefined,
    onChange: (event) => onChange(field.name, event.target.value),
  };
  return (
    <div className={`field${field.type === "textarea" ? " field-wide" : ""}`}>
      <label htmlFor={id}>{field.label}{field.required && <span className="required-mark" aria-hidden="true"> *</span>}</label>
      {field.type === "select" ? (
        <select {...common}>
          <option value="">{field.required ? "Выберите из списка" : "Все"}</option>
          {(lookups[field.resource] || []).map((item) => <option key={item.id} value={item.id}>{optionLabel(field.resource, item)}</option>)}
        </select>
      ) : field.type === "textarea" ? (
        <textarea {...common} rows="4" />
      ) : (
        <input {...common} type={field.type || "text"} min={field.min} max={field.max} step={field.step} />
      )}
      {error ? <span className="field-error" id={`${id}-error`}>{error}</span>
        : field.hint && <span className="field-hint" id={`${id}-hint`}>{field.hint}</span>}
    </div>
  );
}
