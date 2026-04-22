/**
 * Fondo starfield con 3 capas de paralaje.
 *
 * Se posiciona absolute dentro de un contenedor `relative overflow-hidden`.
 * El gradiente radial base + las estrellas animadas crean una sensación
 * cósmica y editorial a la vez, reemplazando los mesh blobs + noise SVG.
 *
 * Los estilos viven en `app/starfield.css` (global). Los movimos ahí desde
 * un CSS module porque Next.js no estaba rescribiendo la referencia al
 * `@keyframes` scoped, dejando la animación apuntando a un keyframe
 * inexistente → starfield estático.
 */
export function Starfield() {
  return (
    <div aria-hidden="true" className="sf-wrapper">
      <div className="sf-stars-1" />
      <div className="sf-stars-2" />
      <div className="sf-stars-3" />
    </div>
  );
}
