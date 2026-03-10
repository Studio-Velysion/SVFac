import { X, Download } from 'lucide-react';
import modalStyles from './AideModal.module.css';
import styles from './UpdatePopup.module.css';

export default function UpdatePopup({ open, onClose, onIgnore, update }) {
  if (!open || !update) return null;

  const handleDownload = () => {
    if (typeof window !== 'undefined' && window.electronAPI?.openExternal) {
      window.electronAPI.openExternal(update.url);
    } else {
      window.open(update.url, '_blank');
    }
  };

  return (
    <div className={modalStyles.overlay} onClick={onClose}>
      <div className={modalStyles.modal} onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
        <div className={modalStyles.header}>
          <h2 className={modalStyles.title}>Mise à jour disponible</h2>
          <button type="button" className={modalStyles.closeBtn} onClick={onClose} aria-label="Fermer">
            <X size={24} />
          </button>
        </div>
        <div className={modalStyles.content}>
          <p className={modalStyles.intro}>
            Une nouvelle version <strong>v{update.version}</strong> est disponible. Téléchargez-la depuis la page des versions.
          </p>
          {update.body && (
            <div className={styles.bodyWrap}>
              <pre className={modalStyles.licenseText}>{update.body}</pre>
            </div>
          )}
          <div className={styles.actions}>
            <button type="button" className={styles.primaryBtn} onClick={handleDownload}>
              <Download size={18} /> Télécharger
            </button>
            <button type="button" className={styles.secondaryBtn} onClick={onIgnore}>
              Ignorer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
