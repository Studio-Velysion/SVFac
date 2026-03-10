import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Save, FolderOpen, FileText, Plus, Folder } from 'lucide-react';
import ClientDossierModal from '../components/ClientDossierModal';
import styles from './ClientForm.module.css';

const emptyClient = {
  name: '',
  company: '',
  email: '',
  phone: '',
  address: '',
  postalCode: '',
  city: '',
  siret: '',
  notes: '',
  isClient: false,
};

export default function ClientForm({ store }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state, addClient, updateClient } = store;
  const isNew = id === 'nouveau' || !id;

  const existing = state.clients.find((c) => c.id === id);
  const [form, setForm] = useState(emptyClient);
  const [noteFiles, setNoteFiles] = useState([]);
  const [clientFolderPath, setClientFolderPath] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [showDossierModal, setShowDossierModal] = useState(false);

  useEffect(() => {
    if (!isNew && existing) setForm({ ...emptyClient, ...existing });
  }, [id, isNew, existing?.id]);

  const basePath = state.settings?.clientFolderPath;
  const loadFolderAndNotes = useCallback(async () => {
    if (!basePath || !existing || !window.electronAPI) return;
    const name = existing.company?.trim() || existing.name?.trim() || 'Client';
    const folder = await window.electronAPI.getClientFolderPath(basePath, name);
    setClientFolderPath(folder);
    if (folder) {
      const list = await window.electronAPI.listNoteFiles(folder);
      setNoteFiles(list);
    } else {
      setNoteFiles([]);
    }
  }, [basePath, existing?.id, existing?.company, existing?.name]);

  useEffect(() => {
    if (!isNew && basePath && existing) loadFolderAndNotes();
  }, [isNew, basePath, existing?.id, loadFolderAndNotes]);

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isNew) {
      const newId = addClient(form);
      const basePath = state.settings?.clientFolderPath;
      if (basePath && window.electronAPI?.createClientFolder) {
        const clientName = form.company?.trim() || form.name?.trim() || 'Client';
        await window.electronAPI.createClientFolder(basePath, clientName);
      }
      navigate(`/clients/${newId}`);
    } else {
      updateClient(id, form);
      navigate('/clients');
    }
  };

  return (
    <div className={styles.page}>
      <div className="page-header">
        <Link to="/clients" className="btn btn-ghost">
          <ArrowLeft size={18} /> Retour
        </Link>
        <h1 className="page-title">{isNew ? 'Nouveau client' : 'Modifier le client'}</h1>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.blockTitle}>Informations générales</h2>
          <div className={styles.grid}>
            <div>
              <label className="label">Nom du contact</label>
              <input
                type="text"
                className="input"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div>
              <label className="label">Société</label>
              <input
                type="text"
                className="input"
                value={form.company}
                onChange={(e) => handleChange('company', e.target.value)}
                placeholder="Raison sociale"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="contact@exemple.fr"
              />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input
                type="tel"
                className="input"
                value={form.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                placeholder="01 23 45 67 89"
              />
            </div>
            <div>
              <label className="label">SIRET</label>
              <input
                type="text"
                className="input"
                value={form.siret}
                onChange={(e) => handleChange('siret', e.target.value)}
                placeholder="Optionnel"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.blockTitle}>Adresse</h2>
          <div className={styles.grid}>
            <div className={styles.full}>
              <label className="label">Adresse</label>
              <input
                type="text"
                className="input"
                value={form.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="123 rue Example"
              />
            </div>
            <div>
              <label className="label">Code postal</label>
              <input
                type="text"
                className="input"
                value={form.postalCode}
                onChange={(e) => handleChange('postalCode', e.target.value)}
                placeholder="75001"
              />
            </div>
            <div>
              <label className="label">Ville</label>
              <input
                type="text"
                className="input"
                value={form.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Paris"
              />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 className={styles.blockTitle}>Notes</h2>
          <textarea
            className="input"
            rows={3}
            value={form.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Notes sur ce client..."
          />
        </div>

        {!isNew && window.electronAPI && basePath && (
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 className={styles.blockTitle}>
              <FolderOpen size={18} /> Dossier client
            </h2>
            <p className={styles.folderHint}>
              Fichiers et sous-dossiers du client. Le dossier de base est défini dans Paramètres (un seul pour tous les clients).
            </p>
            {clientFolderPath && (
              <>
                <div className={styles.folderRow}>
                  <input
                    type="text"
                    readOnly
                    className="input"
                    value={clientFolderPath}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setShowDossierModal(true)}
                  >
                    <Folder size={16} /> Ouvrir le dossier
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => window.electronAPI.openFolder(clientFolderPath)}
                  >
                    <FolderOpen size={16} /> Dans l’explorateur
                  </button>
                </div>
                <div className={styles.notesSection}>
                  <h3 className={styles.notesSubtitle}>Notes (fichiers dans le dossier)</h3>
                  <ul className={styles.noteList}>
                    {noteFiles.length === 0 ? (
                      <li className={styles.noteEmpty}>Aucune note pour l’instant.</li>
                    ) : (
                      noteFiles.map((f) => (
                        <li key={f.name} className={styles.noteItem}>
                          <FileText size={14} /> {f.name}
                        </li>
                      ))
                    )}
                  </ul>
                  <div className={styles.newNote}>
                    <label className="label">Nouvelle note</label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Titre de la note (ex. Réunion du 05/03)"
                      value={newNoteTitle}
                      onChange={(e) => setNewNoteTitle(e.target.value)}
                    />
                    <textarea
                      className="input"
                      rows={4}
                      placeholder="Contenu… (enregistré en .txt dans le dossier client)"
                      value={newNoteContent}
                      onChange={(e) => setNewNoteContent(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-primary"
                      disabled={!newNoteTitle.trim() || savingNote}
                      onClick={async () => {
                        const title = newNoteTitle.trim();
                        if (!title) return;
                        setSavingNote(true);
                        const res = await window.electronAPI.writeNote(clientFolderPath, title + '.txt', newNoteContent);
                        setSavingNote(false);
                        if (res?.ok) {
                          setNewNoteTitle('');
                          setNewNoteContent('');
                          loadFolderAndNotes();
                        }
                      }}
                    >
                      <Plus size={16} /> Enregistrer la note dans le dossier
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {showDossierModal && existing && basePath && (
          <ClientDossierModal
            client={existing}
            basePath={basePath}
            onClose={() => setShowDossierModal(false)}
            store={store}
          />
        )}

        <div className={styles.actions}>
          <Link to="/clients" className="btn btn-secondary">Annuler</Link>
          <button type="submit" className="btn btn-primary">
            <Save size={18} /> {isNew ? 'Créer le client' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
