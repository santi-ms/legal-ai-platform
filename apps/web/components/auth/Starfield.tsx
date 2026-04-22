import styles from "./Starfield.module.css";

/**
 * Fondo starfield con 3 capas de paralaje.
 *
 * Se posiciona absolute dentro de un contenedor `relative overflow-hidden`.
 * El gradiente radial base + las estrellas animadas crean una sensación
 * cósmica y editorial a la vez, reemplazando los mesh blobs + noise SVG.
 *
 * Adaptado de un snippet viral (styled-components) a CSS modules + Tailwind.
 */
export function Starfield() {
  return (
    <div aria-hidden="true" className={styles.wrapper}>
      <div className={styles.stars1} />
      <div className={styles.stars2} />
      <div className={styles.stars3} />
    </div>
  );
}
