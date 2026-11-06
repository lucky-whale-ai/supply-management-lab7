import { useEffect, useState } from "react";

export function ProductPhoto({ src, name = "Товар" }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => { setFailed(false); }, [src]);
  if (!src || failed) return <div className="photo-placeholder">Фотография недоступна</div>;
  return <img className="product-photo" src={src} alt={name} onError={() => setFailed(true)} />;
}
