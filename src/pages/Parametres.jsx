import { useState, useRef, useEffect, useCallback } from 'react';
import { useDrag, useDrop, DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Save, Upload, Building2, Mail, Plus, Trash2, FolderOpen, AlertTriangle, Settings as SettingsIcon, FileText, Sun, Moon, Download, Upload as UploadIcon, Cloud, Layout, GripVertical } from 'lucide-react';
import { STORAGE_KEY } from '../store/useStore';
import JSZip from 'jszip';
import { DocumentContent } from '../components/DocumentPrint';
import styles from './Parametres.module.css';

const DOC_BLOCK_TYPE = 'document-block';

function moveOrder(arr, fromIndex, toIndex) {
  if (fromIndex === toIndex) return arr;
  const copy = [...arr];
  const [removed] = copy.splice(fromIndex, 1);
  copy.splice(toIndex, 0, removed);
  return copy;
}

const BACKUP_FILENAME = 'backup.json';
function getBackupZipFilename() {
  return `backup-svfac-${new Date().toISOString().slice(0, 10)}.zip`;
}

const CATEGORIES = [
  { id: 'entreprise', label: 'Mon entreprise', icon: Building2 },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'modele', label: 'Modèle de document', icon: Layout },
  { id: 'dossiers', label: 'Dossiers', icon: FolderOpen },
  { id: 'emails', label: 'Emails', icon: Mail },
  { id: 'googledrive', label: 'Google Drive', icon: Cloud },
  { id: 'donnees', label: 'Données', icon: AlertTriangle },
];

const DOCUMENT_BLOCKS = [
  { id: 'company', label: 'En-tête entreprise (logo, nom, adresse)' },
  { id: 'header', label: 'Référence et bloc client' },
  { id: 'notes', label: 'Notes' },
  { id: 'date', label: 'Date du document' },
  { id: 'lines', label: 'Tableau des lignes' },
  { id: 'totals', label: 'Totaux (HT, TVA, TTC)' },
  { id: 'amountLetters', label: 'Montant en lettres' },
  { id: 'payment', label: 'Mode de paiement' },
  { id: 'footer', label: 'Pied de page' },
];

const DEFAULT_BLOCK_ORDER = DOCUMENT_BLOCKS.map((b) => b.id);

function getDocumentTemplate(settings) {
  const dt = settings?.documentTemplate;
  return {
    blockOrder: Array.isArray(dt?.blockOrder) && dt.blockOrder.length ? dt.blockOrder : DEFAULT_BLOCK_ORDER,
    options: {
      showLogo: dt?.options?.showLogo !== false,
      showSiret: dt?.options?.showSiret !== false,
      showCompanyEmail: dt?.options?.showCompanyEmail !== false,
      showCompanyPhone: dt?.options?.showCompanyPhone !== false,
      showFooter: dt?.options?.showFooter !== false,
      footerText: dt?.options?.footerText ?? 'Document généré par SVFac — Studio Velysion Facture',
      tvaApplicable: settings?.tvaApplicable !== false,
      showUnits: settings?.showUnits !== false,
    },
  };
}

function getSampleDoc(state) {
  const devise = state.settings?.devise ?? '€';
  const lines = [
    { description: 'Prestation exemple', quantity: 2, unit: 'u', priceHT: 100, tva: 20, totalTTC: 240 },
    { description: 'Fourniture ou autre ligne', quantity: 1, unit: 'u', priceHT: 50, tva: 20, totalTTC: 60 },
  ];
  return {
    type: 'devis',
    ref: 'DEV-0001',
    date: new Date().toISOString().slice(0, 10),
    notes: 'Exemple de notes pour l’aperçu.',
    lines,
    totalHT: 250,
    totalTVA: 50,
    totalTTC: 300,
    devise,
  };
}

function DraggablePaletteItem({ blockId, index, label, onReorder }) {
  const [{ isDragging }, drag] = useDrag({
    type: DOC_BLOCK_TYPE,
    item: () => ({ blockId, index }),
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [{ isOver }, drop] = useDrop({
    accept: DOC_BLOCK_TYPE,
    drop: (item) => {
      if (item.index !== index) onReorder(item.index, index);
    },
    collect: (monitor) => ({ isOver: monitor.isOver() }),
  });
  return (
    <div
      ref={(node) => drag(drop(node))}
      className={
        styles.paletteItem +
        (isDragging ? ' ' + styles.paletteItemDragging : '') +
        (isOver ? ' ' + styles.paletteItemOver : '')
      }
    >
      <GripVertical size={18} className={styles.grip} />
      <span>{label}</span>
    </div>
  );
}

function ModeleEditor({ settings, state, handleSettingsChange, getDocumentTemplate, saveSettings }) {
  const template = getDocumentTemplate(settings);
  const blockOrder = template.blockOrder;
  const options = template.options;
  const sampleDoc = getSampleDoc(state);
  const company = state.company || {};
  const client = (state.clients && state.clients[0]) || {
    company: 'Client exemple',
    address: '123 rue Example',
    postalCode: '75001',
    city: 'Paris',
    email: 'client@exemple.fr',
  };

  const handleReorder = useCallback(
    (fromIndex, toIndex) => {
      const newOrder = moveOrder(blockOrder, fromIndex, toIndex);
      handleSettingsChange('documentTemplate', {
        ...template,
        blockOrder: newOrder,
      });
    },
    [blockOrder, template, handleSettingsChange]
  );

  return (
    <>
      <div className={styles.modeleLayout}>
        <aside className={styles.modelePalette}>
          <h3 className={styles.modelePaletteTitle}>Blocs</h3>
          <p className={styles.hint}>Glissez-déposez les blocs ici pour réordonner. L’aperçu à droite affiche le document tel qu’il sera imprimé.</p>
          <div className={styles.paletteList}>
            {blockOrder.map((blockId, index) => {
              const block = DOCUMENT_BLOCKS.find((b) => b.id === blockId);
              if (!block) return null;
              return (
                <DraggablePaletteItem
                  key={`palette-${blockId}-${index}`}
                  blockId={blockId}
                  index={index}
                  label={block.label}
                  onReorder={handleReorder}
                />
              );
            })}
          </div>
        </aside>
        <div className={styles.modelePreview}>
          <h3 className={styles.modelePreviewTitle}>Aperçu du document</h3>
          <p className={styles.hint} style={{ marginBottom: '0.5rem' }}>Mise en page réelle : en-tête et client côte à côte, puis le reste dans l’ordre choisi à gauche.</p>
          <div className={styles.previewDocumentWrap}>
            <DocumentContent
              doc={sampleDoc}
              company={company}
              client={client}
              template={template}
            />
          </div>
        </div>
      </div>
      <section className={styles.subSection}>
        <h3 className={styles.subSectionTitle}>Éléments à afficher</h3>
        <div className={styles.grid}>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={options.showLogo}
              onChange={(e) => {
                const current = getDocumentTemplate(settings);
                handleSettingsChange('documentTemplate', {
                  ...current,
                  options: { ...current.options, showLogo: e.target.checked },
                });
              }}
            />
            <span>Logo entreprise</span>
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={options.showSiret}
              onChange={(e) => {
                const current = getDocumentTemplate(settings);
                handleSettingsChange('documentTemplate', { ...current, options: { ...current.options, showSiret: e.target.checked } });
              }}
            />
            <span>SIRET</span>
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={options.showCompanyEmail}
              onChange={(e) => {
                const current = getDocumentTemplate(settings);
                handleSettingsChange('documentTemplate', { ...current, options: { ...current.options, showCompanyEmail: e.target.checked } });
              }}
            />
            <span>Email entreprise</span>
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={options.showCompanyPhone}
              onChange={(e) => {
                const current = getDocumentTemplate(settings);
                handleSettingsChange('documentTemplate', { ...current, options: { ...current.options, showCompanyPhone: e.target.checked } });
              }}
            />
            <span>Téléphone entreprise</span>
          </label>
          <label className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={options.showFooter}
              onChange={(e) => {
                const current = getDocumentTemplate(settings);
                handleSettingsChange('documentTemplate', { ...current, options: { ...current.options, showFooter: e.target.checked } });
              }}
            />
            <span>Pied de page</span>
          </label>
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label className="label">Texte du pied de page</label>
          <input
            type="text"
            className="input"
            value={options.footerText ?? ''}
            onChange={(e) => {
              const current = getDocumentTemplate(settings);
              handleSettingsChange('documentTemplate', { ...current, options: { ...current.options, footerText: e.target.value } });
            }}
            placeholder="Document généré par SVFac"
          />
        </div>
      </section>
      <div className={styles.actions}>
        <button type="button" className="btn btn-primary" onClick={saveSettings}>
          <Save size={18} /> Enregistrer le modèle
        </button>
      </div>
    </>
  );
}

export default function Parametres({ store }) {
  const { state, updateCompany, updateSettings, addEmailTemplate, updateEmailTemplate, deleteEmailTemplate } = store;
  const [activeCategory, setActiveCategory] = useState('entreprise');
  const [company, setCompany] = useState(state.company || {});
  const [settings, setSettings] = useState(state.settings || {});
  const [newTpl, setNewTpl] = useState({ name: '', to: '', subject: '', body: '' });
  const [editingId, setEditingId] = useState(null);
  const fileInputRef = useRef(null);
  const backupInputRef = useRef(null);
  const templates = state.emailTemplates || [];
  const [tvaInput, setTvaInput] = useState(String(settings.tvaRate ?? 0));
  useEffect(() => {
    setTvaInput(String(settings.tvaRate ?? 0));
  }, [settings.tvaRate]);

  const handleCompanyChange = (field, value) => {
    setCompany((c) => ({ ...c, [field]: value }));
  };

  const handleSettingsChange = (field, value) => {
    setSettings((s) => ({ ...s, [field]: value }));
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = () => handleCompanyChange('logo', reader.result);
    reader.readAsDataURL(file);
  };

  const saveCompany = () => {
    updateCompany(company);
  };

  const saveSettings = () => {
    updateSettings(settings);
  };

  return (
    <div className={styles.page + (activeCategory === 'modele' ? ' ' + styles.pageModele : '')}>
      <h1 className="page-title">Paramètres</h1>

      <div className={styles.layout}>
        <nav className={styles.categories}>
          {CATEGORIES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={activeCategory === id ? styles.categoryActive : styles.category}
              onClick={() => setActiveCategory(id)}
            >
              <Icon size={20} />
              <span>{label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.content}>
          {activeCategory === 'entreprise' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <Building2 size={20} /> Mon entreprise
        </h2>
        <div className={styles.logoRow}>
          <div>
            <label className="label">Logo</label>
            <div className={styles.logoBox}>
              {company.logo ? (
                <img src={company.logo} alt="Logo" className={styles.logoPreview} />
              ) : (
                <span className={styles.logoPlaceholder}>Logo</span>
              )}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> Choisir
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleLogoChange}
              />
            </div>
          </div>
        </div>
        <div className={styles.grid}>
          <div className={styles.full}>
            <label className="label">Raison sociale</label>
            <input
              type="text"
              className="input"
              value={company.name ?? ''}
              onChange={(e) => handleCompanyChange('name', e.target.value)}
              placeholder="Nom de l'entreprise"
            />
          </div>
          <div className={styles.full}>
            <label className="label">Adresse</label>
            <input
              type="text"
              className="input"
              value={company.address ?? ''}
              onChange={(e) => handleCompanyChange('address', e.target.value)}
              placeholder="Adresse postale"
            />
          </div>
          <div>
            <label className="label">Code postal</label>
            <input
              type="text"
              className="input"
              value={company.postalCode ?? ''}
              onChange={(e) => handleCompanyChange('postalCode', e.target.value)}
              placeholder="75001"
            />
          </div>
          <div>
            <label className="label">Ville</label>
            <input
              type="text"
              className="input"
              value={company.city ?? ''}
              onChange={(e) => handleCompanyChange('city', e.target.value)}
              placeholder="Paris"
            />
          </div>
          <div>
            <label className="label">SIRET</label>
            <input
              type="text"
              className="input"
              value={company.siret ?? ''}
              onChange={(e) => handleCompanyChange('siret', e.target.value)}
              placeholder="123 456 789 00012"
            />
          </div>
          <div>
            <label className="label">N° TVA (optionnel)</label>
            <input
              type="text"
              className="input"
              value={company.tva ?? ''}
              onChange={(e) => handleCompanyChange('tva', e.target.value)}
              placeholder="FR XX XXXXXXXXX"
            />
          </div>
          <div>
            <label className="label">Email</label>
            <input
              type="email"
              className="input"
              value={company.email ?? ''}
              onChange={(e) => handleCompanyChange('email', e.target.value)}
              placeholder="contact@entreprise.fr"
            />
          </div>
          <div>
            <label className="label">Téléphone</label>
            <input
              type="tel"
              className="input"
              value={company.phone ?? ''}
              onChange={(e) => handleCompanyChange('phone', e.target.value)}
              placeholder="01 23 45 67 89"
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={saveCompany}>
            <Save size={18} /> Enregistrer l'entreprise
          </button>
        </div>
      </div>
          )}

          {activeCategory === 'documents' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <SettingsIcon size={20} /> Préférences documents
        </h2>
        <div className={styles.grid} style={{ marginBottom: '1.5rem' }}>
          <div>
            <label className="label">Apparence</label>
            <select
              className="input"
              value={settings.theme ?? 'dark'}
              onChange={(e) => handleSettingsChange('theme', e.target.value)}
            >
              <option value="dark"><Moon size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Sombre</option>
              <option value="light"><Sun size={14} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Clair</option>
            </select>
          </div>
        </div>
        <div className={styles.grid}>
          <div>
            <label className="label">Préfixe devis</label>
            <input
              type="text"
              className="input"
              value={settings.devisPrefix ?? 'DEV'}
              onChange={(e) => handleSettingsChange('devisPrefix', e.target.value)}
              placeholder="DEV"
            />
          </div>
          <div>
            <label className="label">Préfixe facture</label>
            <input
              type="text"
              className="input"
              value={settings.facturePrefix ?? 'FAC'}
              onChange={(e) => handleSettingsChange('facturePrefix', e.target.value)}
              placeholder="FAC"
            />
          </div>
          <div>
            <label className="label">Préfixe bon de livraison</label>
            <input
              type="text"
              className="input"
              value={settings.livraisonPrefix ?? 'BL'}
              onChange={(e) => handleSettingsChange('livraisonPrefix', e.target.value)}
              placeholder="BL"
            />
          </div>
          <div>
            <label className="label">Préfixe avoir</label>
            <input
              type="text"
              className="input"
              value={settings.avoirPrefix ?? 'AVO'}
              onChange={(e) => handleSettingsChange('avoirPrefix', e.target.value)}
              placeholder="AVO"
            />
          </div>
          <div>
            <label className="label">Taux de TVA par défaut (%)</label>
            <input
              type="text"
              inputMode="decimal"
              className="input"
              value={tvaInput}
              onChange={(e) => setTvaInput(e.target.value)}
              onBlur={() => {
                const raw = String(tvaInput).replace(',', '.');
                const num = parseFloat(raw);
                if (raw === '' || (!Number.isNaN(num) && num >= 0 && num <= 100)) {
                  handleSettingsChange('tvaRate', raw === '' ? 0 : num);
                  setTvaInput(String(raw === '' ? 0 : num));
                } else {
                  setTvaInput(String(settings.tvaRate ?? 0));
                }
              }}
              placeholder="0"
            />
            <span className={styles.hint} style={{ fontSize: '0.75rem', marginTop: 2 }}>Point ou virgule acceptés</span>
          </div>
          <div>
            <label className="label">Devise</label>
            <input
              type="text"
              className="input"
              value={settings.devise ?? '€'}
              onChange={(e) => handleSettingsChange('devise', e.target.value)}
              placeholder="€"
            />
          </div>
          <div className={styles.toggleRow}>
            <label className="label">TVA applicable</label>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.tvaApplicable !== false}
                onChange={(e) => handleSettingsChange('tvaApplicable', e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
            <p className={styles.hint}>
              {settings.tvaApplicable !== false
                ? 'Une mention « TVA applicable » sera affichée sur les documents.'
                : 'Une mention « Pas de TVA applicable » sera affichée sur les documents.'}
            </p>
          </div>
          <div className={styles.toggleRow}>
            <label className="label">Afficher les unités</label>
            <label className={styles.switch}>
              <input
                type="checkbox"
                checked={settings.showUnits !== false}
                onChange={(e) => handleSettingsChange('showUnits', e.target.checked)}
              />
              <span className={styles.slider} />
            </label>
          </div>
          <div>
            <label className="label">Validité devis (jours)</label>
            <input
              type="number"
              min="1"
              className="input"
              value={settings.validiteDevisJours ?? 30}
              onChange={(e) => handleSettingsChange('validiteDevisJours', e.target.value ? Number(e.target.value) : 30)}
            />
          </div>
        </div>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={saveSettings}>
            <Save size={18} /> Enregistrer les préférences
          </button>
        </div>
      </div>
          )}

          {activeCategory === 'modele' && (
      <div className={styles.categoryCard + ' ' + styles.modeleFullCard}>
        <h2 className={styles.sectionTitle}>
          <Layout size={20} /> Modèle de document
        </h2>
        <p className={styles.hint}>
          Glissez les blocs depuis la gauche vers l’aperçu au centre, ou réordonnez-les directement dans l’aperçu par glisser-déposer.
        </p>
        <DndProvider backend={HTML5Backend}>
          <ModeleEditor
            settings={settings}
            state={state}
            handleSettingsChange={handleSettingsChange}
            getDocumentTemplate={getDocumentTemplate}
            saveSettings={saveSettings}
          />
        </DndProvider>
      </div>
          )}

          {activeCategory === 'dossiers' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <FolderOpen size={20} /> Dossiers
        </h2>
        <section className={styles.subSection}>
          <h3 className={styles.subSectionTitle}>Emplacement dossier client</h3>
          <p className={styles.hint}>
            Dossier de base où un sous-dossier par client sera créé (devis, factures, bons de livraison, notes).
          </p>
          <div className={styles.folderRow}>
            <input
              type="text"
              readOnly
              className="input"
              value={settings.clientFolderPath ?? ''}
              placeholder="Aucun emplacement choisi"
              style={{ flex: 1 }}
            />
            {typeof window !== 'undefined' && window.electronAPI?.selectFolder && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  const path = await window.electronAPI.selectFolder();
                  if (path) handleSettingsChange('clientFolderPath', path);
                }}
              >
                <FolderOpen size={16} /> Parcourir
              </button>
            )}
          </div>
        </section>
        <section className={styles.subSection}>
          <h3 className={styles.subSectionTitle}>Studio Velysion Project Manager</h3>
          <p className={styles.hint}>
            Ouvrez le logiciel Project Manager (projets, tâches, comptabilité) depuis SVFac. Indiquez le dossier du projet ou l’exécutable.
          </p>
          <div className={styles.folderRow}>
            <input
              type="text"
              readOnly
              className="input"
              value={settings.projectManagerPath ?? ''}
              placeholder="Aucun emplacement choisi"
              style={{ flex: 1 }}
            />
            {typeof window !== 'undefined' && window.electronAPI?.chooseProjectManagerFolder && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  const path = await window.electronAPI.chooseProjectManagerFolder();
                  if (path) handleSettingsChange('projectManagerPath', path);
                }}
              >
                <FolderOpen size={16} /> Parcourir
              </button>
            )}
            {typeof window !== 'undefined' && window.electronAPI?.launchProjectManager && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  const result = await window.electronAPI.launchProjectManager(settings.projectManagerPath ?? '');
                  if (result && !result.success && result.error) alert(result.error);
                }}
              >
                Ouvrir Project Manager
              </button>
            )}
          </div>
          <div className={styles.actions}>
            <button type="button" className="btn btn-primary" onClick={saveSettings}>
              <Save size={18} /> Enregistrer
            </button>
          </div>
        </section>
        <div className={styles.actions}>
          <button type="button" className="btn btn-primary" onClick={saveSettings}>
            <Save size={18} /> Enregistrer les dossiers
          </button>
        </div>
      </div>
          )}

          {activeCategory === 'googledrive' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <Cloud size={20} /> Google Drive
        </h2>
        <p className={styles.hint}>
          Connectez-vous à Google Drive pour enregistrer et restaurer vos sauvegardes directement dans le cloud. Vous pourrez ensuite sauvegarder ou restaurer vos données depuis n’importe quel appareil.
        </p>
        <div className={styles.grid} style={{ marginBottom: '1rem' }}>
          <div className={styles.full}>
            <label className="label">Client ID (Google Cloud)</label>
            <input
              type="text"
              className="input"
              value={state.settings.googleClientId ?? ''}
              onChange={(e) => handleSettingsChange('googleClientId', e.target.value)}
              placeholder="xxxxx.apps.googleusercontent.com"
            />
          </div>
          <div className={styles.full}>
            <label className="label">Client Secret (optionnel en bureau)</label>
            <input
              type="password"
              className="input"
              value={state.settings.googleClientSecret ?? ''}
              onChange={(e) => handleSettingsChange('googleClientSecret', e.target.value)}
              placeholder="Gxxx..."
            />
          </div>
          <div className={styles.full}>
            <label className="label">État</label>
            <p className={styles.hint} style={{ marginTop: 4 }}>
              {state.settings.googleDriveConnected
                ? 'Connecté à Google Drive. Vous pouvez sauvegarder et restaurer vos données.'
                : 'Non connecté. Cliquez sur « Se connecter à Google Drive » pour autoriser l’application.'}
            </p>
          </div>
        </div>
        <div className={styles.actions} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          {!state.settings.googleDriveConnected ? (
            <button
              type="button"
              className="btn btn-primary"
              onClick={async () => {
                if (window.electronAPI?.googleDriveConnect) {
                  try {
                    const result = await window.electronAPI.googleDriveConnect(
                      state.settings.googleClientId || undefined,
                      state.settings.googleClientSecret || undefined
                    );
                    if (result?.ok) {
                      handleSettingsChange('googleDriveConnected', true);
                      saveSettings();
                    } else {
                      alert(result?.error || 'Connexion annulée ou erreur.');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Erreur lors de la connexion à Google Drive.');
                  }
                } else {
                  alert('La connexion Google Drive est disponible dans la version bureau (application installée). Lancez l’application depuis l’installateur pour utiliser cette fonction.');
                }
              }}
            >
              <Cloud size={18} /> Se connecter à Google Drive
            </button>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={async () => {
                  if (window.electronAPI?.googleDriveSave) {
                    try {
                      const result = await window.electronAPI.googleDriveSave(JSON.stringify(state, null, 2));
                      if (result?.ok) {
                        alert('Sauvegarde enregistrée sur Google Drive.');
                      } else {
                        alert(result?.error || 'Erreur lors de la sauvegarde.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Erreur lors de la sauvegarde sur Google Drive.');
                    }
                  } else {
                    alert('Fonction disponible dans la version bureau.');
                  }
                }}
              >
                <UploadIcon size={18} /> Sauvegarder sur Google Drive
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={async () => {
                  if (window.electronAPI?.googleDriveRestore) {
                    try {
                      const result = await window.electronAPI.googleDriveRestore();
                      if (result?.ok && result?.data) {
                        if (!globalThis.confirm('Remplacer toutes les données actuelles par la sauvegarde sélectionnée ? L’application va redémarrer.')) return;
                        localStorage.setItem(STORAGE_KEY, result.data);
                        window.location.reload();
                      } else if (!result?.cancelled) {
                        alert(result?.error || 'Aucune sauvegarde sélectionnée ou erreur.');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Erreur lors de la restauration depuis Google Drive.');
                    }
                  } else {
                    alert('Fonction disponible dans la version bureau.');
                  }
                }}
              >
                <Download size={18} /> Restaurer depuis Google Drive
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                  handleSettingsChange('googleDriveConnected', false);
                  saveSettings();
                }}
              >
                Se déconnecter
              </button>
            </>
          )}
        </div>
      </div>
          )}

          {activeCategory === 'emails' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <Mail size={20} /> Emails préremplis
        </h2>
        <p className={styles.hint}>
          Créez des modèles d’email (objet + corps). Utilisez : {'{client_nom}'}, {'{ref}'}, {'{total}'}, {'{date}'}, {'{type}'}. Depuis un devis/facture, cliquez sur « Envoyer par email » et sélectionnez un modèle pour ouvrir votre client mail.
        </p>
        <div className={styles.grid} style={{ marginBottom: '1rem' }}>
          <div className={styles.full}>
            <label className="label">Nom du modèle</label>
            <input
              type="text"
              className="input"
              value={editingId ? (templates.find(t => t.id === editingId)?.name ?? '') : newTpl.name}
              onChange={(e) => editingId ? updateEmailTemplate(editingId, { name: e.target.value }) : setNewTpl(t => ({ ...t, name: e.target.value }))}
              placeholder="Ex. Envoi devis"
            />
          </div>
          <div className={styles.full}>
            <label className="label">Destinataire (laisser vide = email du client)</label>
            <input
              type="text"
              className="input"
              value={editingId ? (templates.find(t => t.id === editingId)?.to ?? '') : newTpl.to}
              onChange={(e) => editingId ? updateEmailTemplate(editingId, { to: e.target.value }) : setNewTpl(t => ({ ...t, to: e.target.value }))}
              placeholder="client@exemple.fr"
            />
          </div>
          <div className={styles.full}>
            <label className="label">Objet</label>
            <input
              type="text"
              className="input"
              value={editingId ? (templates.find(t => t.id === editingId)?.subject ?? '') : newTpl.subject}
              onChange={(e) => editingId ? updateEmailTemplate(editingId, { subject: e.target.value }) : setNewTpl(t => ({ ...t, subject: e.target.value }))}
              placeholder="Devis {ref} - {client_nom}"
            />
          </div>
          <div className={styles.full}>
            <label className="label">Corps du message</label>
            <textarea
              className="input"
              rows={4}
              value={editingId ? (templates.find(t => t.id === editingId)?.body ?? '') : newTpl.body}
              onChange={(e) => editingId ? updateEmailTemplate(editingId, { body: e.target.value }) : setNewTpl(t => ({ ...t, body: e.target.value }))}
              placeholder="Bonjour,\n\nVeuillez trouver ci-joint notre {type} {ref} pour un montant de {total} €.\n\nCordialement"
            />
          </div>
        </div>
        {editingId ? (
          <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ marginRight: 8 }}>
            Annuler l’édition
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              if (newTpl.name.trim()) {
                addEmailTemplate({ name: newTpl.name.trim(), to: newTpl.to, subject: newTpl.subject, body: newTpl.body });
                setNewTpl({ name: '', to: '', subject: '', body: '' });
              }
            }}
          >
            <Plus size={18} /> Ajouter ce modèle
          </button>
        )}
        <ul className={styles.templateList}>
          {templates.map((t) => (
            <li key={t.id}>
              <strong>{t.name}</strong>
              <span className={styles.templateMeta}>{t.subject || '(sans objet)'}</span>
              <button type="button" className="btn btn-ghost" onClick={() => setEditingId(t.id)} title="Modifier">Modifier</button>
              <button type="button" className="btn btn-ghost" onClick={() => deleteEmailTemplate(t.id)} title="Supprimer"><Trash2 size={14} /></button>
            </li>
          ))}
        </ul>
        {templates.length === 0 && <p className={styles.hint}>Aucun modèle. Ajoutez-en un ci-dessus.</p>}
      </div>
          )}

          {activeCategory === 'donnees' && (
      <div className={styles.categoryCard}>
        <h2 className={styles.sectionTitle}>
          <Download size={20} /> Sauvegarde et restauration
        </h2>
        <p className={styles.hint}>
          Sauvegardez toutes vos données (clients, devis, factures, paramètres, etc.) dans un fichier .zip. Vous pourrez réimporter ce fichier plus tard pour restaurer l’application.
        </p>
        <div className={styles.actions} style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <button
            type="button"
            className="btn btn-primary"
            onClick={async () => {
              try {
                const zip = new JSZip();
                zip.file(BACKUP_FILENAME, JSON.stringify(state, null, 2));
                const blob = await zip.generateAsync({ type: 'blob' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = getBackupZipFilename();
                a.click();
                URL.revokeObjectURL(url);
              } catch (err) {
                console.error(err);
                alert('Erreur lors de la création de la sauvegarde.');
              }
            }}
          >
            <Download size={18} /> Sauvegarder les données (.zip)
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => backupInputRef.current?.click()}
          >
            <UploadIcon size={18} /> Importer une sauvegarde (.zip)
          </button>
          <input
            ref={backupInputRef}
            type="file"
            accept=".zip"
            style={{ display: 'none' }}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              e.target.value = '';
              try {
                const zip = await JSZip.loadAsync(file);
                const f = zip.file(BACKUP_FILENAME);
                if (!f) {
                  alert('Fichier .zip invalide : aucun backup.json trouvé.');
                  return;
                }
                const text = await f.async('string');
                const data = JSON.parse(text);
                if (!data || typeof data !== 'object') {
                  alert('Contenu de sauvegarde invalide.');
                  return;
                }
                if (!globalThis.confirm('Remplacer toutes les données actuelles par cette sauvegarde ? L’application va redémarrer.')) return;
                localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
                window.location.reload();
              } catch (err) {
                console.error(err);
                alert('Erreur lors de l’import : fichier invalide ou corrompu.');
              }
            }}
          />
        </div>
      </div>
          )}
        </div>
      </div>
    </div>
  );
}
