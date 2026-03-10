import { useState, useEffect, useCallback } from 'react';
import { X, FolderOpen, FolderPlus, Plus, Trash2, Folder, File } from 'lucide-react';
import styles from './ClientDossierModal.module.css';

function sanitizeFolderName(name) {
  if (!name || typeof name !== 'string') return 'Client';
  return name.replace(/[\s]+/g, ' ').trim().replace(/[<>:"/\\|?*]/g, '_').trim() || 'Client';
}

export default function ClientDossierModal({ client, basePath, onClose, store }) {
  const [currentPath, setCurrentPath] = useState(null);
  const [contents, setContents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const api = typeof window !== 'undefined' ? window.electronAPI : null;
  const clientName = client ? (client.company?.trim() || client.name?.trim() || 'Client') : '';
  const loadPath = useCallback(
    async (folderPath) => {
      if (!api?.listFolderContents || !folderPath) return;
      setLoading(true);
      try {
        const list = await api.listFolderContents(folderPath);
        setContents(list);
      } catch (_) {
        setContents([]);
      }
      setLoading(false);
    },
    [api]
  );

  useEffect(() => {
    if (!basePath || !clientName || !api?.getClientFolderPath) return;
    api.createClientFolder(basePath, clientName).then(() => {
      api.getClientFolderPath(basePath, clientName).then((p) => setCurrentPath(p));
    });
  }, [basePath, clientName, api]);

  useEffect(() => {
    if (currentPath) loadPath(currentPath);
  }, [currentPath, loadPath]);

  const handleCreateFolder = async () => {
    const name = newFolderName.trim() || 'Nouveau dossier';
    if (!currentPath || !api?.createSubfolder) return;
    const res = await api.createSubfolder(currentPath, name);
    if (res?.ok) {
      setNewFolderName('');
      loadPath(currentPath);
    }
  };

  const handleCreateNote = async () => {
    const title = newNoteTitle.trim();
    if (!title || !currentPath || !api?.writeNote) return;
    setSavingNote(true);
    const res = await api.writeNote(currentPath, title + '.txt', newNoteContent);
    setSavingNote(false);
    if (res?.ok) {
      setNewNoteTitle('');
      setNewNoteContent('');
      loadPath(currentPath);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Supprimer « ${item.name } » ?`)) return;
    if (!api?.deletePath) return;
    const res = await api.deletePath(item.fullPath);
    if (res?.ok) loadPath(currentPath);
  };

  const handleEnterFolder = (item) => {
    if (item.isDirectory) setCurrentPath(item.fullPath);
  };

  const handleOpenInExplorer = () => {
    if (currentPath && api?.openFolder) api.openFolder(currentPath);
  };

  if (!client) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>
            <FolderOpen size={22} /> Dossier — {client.company || client.name || 'Sans nom'}
          </h2>
          <button type="button" className="btn btn-ghost" onClick={onClose} aria-label="Fermer">
            <X size={22} />
          </button>
        </div>
        <div className={styles.pathRow}>
          <input type="text" readOnly className="input" value={currentPath || ''} />
          <button type="button" className="btn btn-secondary" onClick={handleOpenInExplorer}>
            <FolderOpen size={16} /> Ouvrir dans l’explorateur
          </button>
        </div>

        <div className={styles.actionsBar}>
          <div className={styles.addRow}>
            <input
              type="text"
              className="input"
              placeholder="Nom du sous-dossier"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
            />
            <button type="button" className="btn btn-secondary" onClick={handleCreateFolder}>
              <FolderPlus size={16} /> Nouveau dossier
            </button>
          </div>
        </div>

        <div className={styles.contents}>
          <h3 className={styles.subtitle}>Contenu du dossier</h3>
          {loading ? (
            <p className={styles.hint}>Chargement…</p>
          ) : (
            <ul className={styles.list}>
              {contents.map((item) => (
                <li key={item.fullPath} className={styles.listItem}>
                  <button
                    type="button"
                    className={styles.listItemContent}
                    onClick={() => item.isDirectory && handleEnterFolder(item)}
                  >
                    {item.isDirectory ? <Folder size={18} /> : <File size={18} />}
                    <span>{item.name}</span>
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost"
                    title="Supprimer"
                    onClick={() => handleDelete(item)}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
              {contents.length === 0 && !loading && <li className={styles.empty}>Dossier vide</li>}
            </ul>
          )}
        </div>

        <div className={styles.newNote}>
          <h3 className={styles.subtitle}>Ajouter une note (.txt)</h3>
          <input
            type="text"
            className="input"
            placeholder="Titre de la note"
            value={newNoteTitle}
            onChange={(e) => setNewNoteTitle(e.target.value)}
          />
          <textarea
            className="input"
            rows={3}
            placeholder="Contenu…"
            value={newNoteContent}
            onChange={(e) => setNewNoteContent(e.target.value)}
          />
          <button
            type="button"
            className="btn btn-primary"
            disabled={!newNoteTitle.trim() || savingNote}
            onClick={handleCreateNote}
          >
            <Plus size={16} /> Enregistrer la note
          </button>
        </div>
      </div>
    </div>
  );
}
