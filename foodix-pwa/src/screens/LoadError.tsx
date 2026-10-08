import styles from './LoadError.module.css';

/** Affiché si menu.json ne peut être chargé (ni réseau, ni copie en cache). */
export default function LoadError() {
  return (
    <main className={styles.screen}>
      <img src="/brand/foodix-logo-nuit.png" width={720} height={358} alt="Foodix, Manger bon, manger mobile" className={styles.logo} />
      <div role="alert" className={styles.box}>
        <strong className={styles.title}>Le menu n’a pas pu être chargé</strong>
        <span className={styles.text}>Vérifiez votre connexion internet, puis réessayez.</span>
      </div>
      <button type="button" className={styles.retry} onClick={() => location.reload()}>
        Réessayer
      </button>
    </main>
  );
}
