import { useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X } from 'lucide-react';
import { getPaymentMethodLabel } from '../lib/paymentMethods';
import styles from './DocumentPrint.module.css';

const NUMBER_TO_LETTERS = [
  'zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf',
];
const TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

function numberToFrench(n) {
  const num = Math.floor(Number(n));
  if (num === 0) return 'zéro';
  if (num < 20) return NUMBER_TO_LETTERS[num];
  if (num < 100) {
    const t = Math.floor(num / 10);
    const u = num % 10;
    if (t === 7) return 'soixante-' + (u < 7 ? NUMBER_TO_LETTERS[10 + u] : 'dix-' + NUMBER_TO_LETTERS[u - 7]);
    if (t === 9) return 'quatre-vingt-' + (u === 0 ? '' : NUMBER_TO_LETTERS[u]);
    return TENS[t] + (u === 0 ? '' : '-' + NUMBER_TO_LETTERS[u]);
  }
  if (num < 1000) {
    const h = Math.floor(num / 100);
    const rest = num % 100;
    const part = h === 1 ? 'cent' : NUMBER_TO_LETTERS[h] + ' cent';
    return part + (rest === 0 ? '' : ' ' + numberToFrench(rest));
  }
  if (num < 2000) return 'mille' + (num % 1000 === 0 ? '' : ' ' + numberToFrench(num % 1000));
  return num + '';
}

function amountToLetters(amount, devise = '€') {
  const entiers = Math.floor(amount);
  const centimes = Math.round((amount - entiers) * 100);
  const partEntiers = entiers === 0 ? 'zéro' : numberToFrench(entiers);
  const partCentimes = centimes === 0 ? 'zéro' : numberToFrench(centimes);
  const units = entiers > 1 ? 'euros' : 'euro';
  return `${partEntiers} ${units} et ${partCentimes} centimes`.replace(/^zéro euros/, 'zéro euro');
}

function escapeHtml(s) {
  if (s == null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Rendu classique (JSX) quand aucun template personnalisé n’est utilisé */
function DefaultDocumentContent({ doc, company, client }) {
  return (
    <div className={styles.doc}>
      <div className={styles.docTopRow}>
        <div className={styles.docCompanyColumn}>
          {company.logo && <img src={company.logo} alt="" className={styles.logo} />}
          <h1 className={styles.companyName}>{company.name || 'Mon entreprise'}</h1>
          {company.address && <p className={styles.companyInfo}>{company.address}</p>}
          {(company.postalCode || company.city) && (
            <p className={styles.companyInfo}>{[company.postalCode, company.city].filter(Boolean).join(' ')}</p>
          )}
          {company.email && <p className={styles.companyInfo}>{company.email}</p>}
          {company.siret && <p className={styles.companyInfo}>SIRET : {company.siret}</p>}
        </div>
        <div className={styles.docRightColumn}>
          <div className={styles.docTitle}>
            {doc.type === 'facture' ? 'FACTURE' : doc.type === 'livraison' ? 'BON DE LIVRAISON' : doc.type === 'avoir' ? 'AVOIR' : 'DEVIS'} N° {doc.ref}
          </div>
          <div className={styles.clientBlock}>
            <strong>Client</strong>
            <p>{client.company || client.name || '—'}</p>
            {client.address && <p>{client.address}</p>}
            {(client.postalCode || client.city) && <p>{[client.postalCode, client.city].filter(Boolean).join(' ')}</p>}
            {client.email && <p>{client.email}</p>}
          </div>
        </div>
      </div>

      {doc.notes && (
        <div className={styles.notesBlock}>
          <strong>Notes</strong>
          <p>{doc.notes}</p>
        </div>
      )}

      <p className={styles.docDate}>
        Date : {doc.date ? format(new Date(doc.date), "d MMMM yyyy", { locale: fr }) : '—'}
      </p>

      <table className={styles.linesTable}>
        <thead>
          <tr>
            <th>Désignation</th>
            <th>Qté</th>
            <th>Un.</th>
            <th>Prix unit. HT</th>
            <th>TVA</th>
            <th>Total TTC</th>
          </tr>
        </thead>
        <tbody>
          {(doc.lines || []).map((line, i) => (
            <tr key={i}>
              <td>{line.description}</td>
              <td>{line.quantity}</td>
              <td>{line.unit || 'u'}</td>
              <td>{(line.priceHT ?? line.price ?? 0).toFixed(2)} {doc.devise}</td>
              <td>{line.tva != null ? `${line.tva} %` : '—'}</td>
              <td>{(line.totalTTC ?? 0).toFixed(2)} {doc.devise}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className={styles.totalsBlock}>
        <div className={styles.totalLine}>
          <span>Total HT</span>
          <span>{(doc.totalHT ?? 0).toFixed(2)} {doc.devise}</span>
        </div>
        <div className={styles.totalLine}>
          <span>TVA</span>
          <span>{(doc.totalTVA ?? 0).toFixed(2)} {doc.devise}</span>
        </div>
        <div className={styles.totalLine + ' ' + styles.totalTTC}>
          <span>Total TTC</span>
          <span>{(doc.totalTTC ?? 0).toFixed(2)} {doc.devise}</span>
        </div>
      </div>

      <p className={styles.amountLetters}>Montant en lettres : {amountToLetters(doc.totalTTC ?? 0, doc.devise)}</p>

      {doc.type === 'facture' && doc.modePaiement && (
        <p className={styles.modePaiement}>Mode de paiement : {getPaymentMethodLabel(doc.modePaiement)}</p>
      )}

      <footer className={styles.docFooter}>
        <p>Document généré par SVFac — Studio Velysion Facture</p>
      </footer>
    </div>
  );
}

const DEFAULT_BLOCK_ORDER = ['company', 'header', 'notes', 'date', 'lines', 'totals', 'amountLetters', 'payment', 'footer'];

function getTemplate(store) {
  const dt = store?.state?.settings?.documentTemplate;
  const s = store?.state?.settings;
  return {
    blockOrder: Array.isArray(dt?.blockOrder) && dt.blockOrder.length ? dt.blockOrder : DEFAULT_BLOCK_ORDER,
    options: {
      showLogo: dt?.options?.showLogo !== false,
      showSiret: dt?.options?.showSiret !== false,
      showCompanyEmail: dt?.options?.showCompanyEmail !== false,
      showCompanyPhone: dt?.options?.showCompanyPhone !== false,
      showFooter: dt?.options?.showFooter !== false,
      footerText: dt?.options?.footerText ?? 'Document généré par SVFac — Studio Velysion Facture',
      tvaApplicable: s?.tvaApplicable !== false,
      showUnits: s?.showUnits !== false,
    },
  };
}

function BlockCompany({ company, options }) {
  return (
    <div className={styles.docCompanyColumn}>
      {options.showLogo && company.logo && <img src={company.logo} alt="" className={styles.logo} />}
      <h1 className={styles.companyName}>{company.name || 'Mon entreprise'}</h1>
      {company.address && <p className={styles.companyInfo}>{company.address}</p>}
      {(company.postalCode || company.city) && (
        <p className={styles.companyInfo}>{[company.postalCode, company.city].filter(Boolean).join(' ')}</p>
      )}
      {options.showCompanyEmail && company.email && <p className={styles.companyInfo}>{company.email}</p>}
      {options.showCompanyPhone && company.phone && <p className={styles.companyInfo}>{company.phone}</p>}
      {options.showSiret && company.siret && <p className={styles.companyInfo}>SIRET : {company.siret}</p>}
    </div>
  );
}

function BlockHeader({ doc, client }) {
  return (
    <div className={styles.docRightColumn}>
      <div className={styles.docTitle}>
        {doc.type === 'facture' ? 'FACTURE' : doc.type === 'livraison' ? 'BON DE LIVRAISON' : doc.type === 'avoir' ? 'AVOIR' : 'DEVIS'} N° {doc.ref}
      </div>
      <div className={styles.clientBlock}>
        <strong>Client</strong>
        <p>{client.company || client.name || '—'}</p>
        {client.address && <p>{client.address}</p>}
        {(client.postalCode || client.city) && <p>{[client.postalCode, client.city].filter(Boolean).join(' ')}</p>}
        {client.email && <p>{client.email}</p>}
      </div>
    </div>
  );
}

function BlockNotes({ doc }) {
  return (
    <div className={styles.notesBlock}>
      <strong>Notes</strong>
      <p>{doc.notes || '—'}</p>
    </div>
  );
}

function BlockDate({ doc }) {
  return (
    <p className={styles.docDate}>
      Date : {doc.date ? format(new Date(doc.date), "d MMMM yyyy", { locale: fr }) : '—'}
    </p>
  );
}

function BlockLines({ doc, options = {} }) {
  const lines = doc.lines || [];
  const showUnits = options.showUnits !== false;
  const tvaApplicable = options.tvaApplicable !== false;
  const colCount = 3 + (showUnits ? 1 : 0) + (tvaApplicable ? 1 : 0) + 1;
  return (
    <table className={styles.linesTable}>
      <thead>
        <tr>
          <th>Désignation</th>
          <th>Qté</th>
          {showUnits && <th>Un.</th>}
          <th>Prix unit. HT</th>
          {tvaApplicable && <th>TVA</th>}
          <th>Total TTC</th>
        </tr>
      </thead>
      <tbody>
        {lines.length === 0 ? (
          <tr>
            <td colSpan={colCount} className={styles.emptyTableHint}>Aucune ligne</td>
          </tr>
        ) : (
          lines.map((line, i) => (
            <tr key={i}>
              <td>{line.description}</td>
              <td>{line.quantity}</td>
              {showUnits && <td>{line.unit || 'u'}</td>}
              <td>{(line.priceHT ?? line.price ?? 0).toFixed(2)} {doc.devise}</td>
              {tvaApplicable && <td>{line.tva != null ? `${line.tva} %` : '—'}</td>}
              <td>{(line.totalTTC ?? 0).toFixed(2)} {doc.devise}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  );
}

function BlockTotals({ doc, options = {} }) {
  const tvaApplicable = options.tvaApplicable !== false;
  return (
    <>
      <div className={styles.totalsBlock}>
        <div className={styles.totalLine}>
          <span>Total HT</span>
          <span>{(doc.totalHT ?? 0).toFixed(2)} {doc.devise}</span>
        </div>
        {tvaApplicable && (
          <div className={styles.totalLine}>
            <span>TVA</span>
            <span>{(doc.totalTVA ?? 0).toFixed(2)} {doc.devise}</span>
          </div>
        )}
        <div className={styles.totalLine + ' ' + styles.totalTTC}>
          <span>Total TTC</span>
          <span>{(doc.totalTTC ?? 0).toFixed(2)} {doc.devise}</span>
        </div>
      </div>
      <p className={styles.tvaMention}>
        {tvaApplicable ? 'TVA applicable.' : 'Pas de TVA applicable.'}
      </p>
    </>
  );
}

function BlockAmountLetters({ doc }) {
  return (
    <p className={styles.amountLetters}>Montant en lettres : {amountToLetters(doc.totalTTC ?? 0, doc.devise)}</p>
  );
}

function BlockPayment({ doc }) {
  if (doc.type === 'facture' && doc.modePaiement) {
    return (
      <p className={styles.modePaiement}>Mode de paiement : {getPaymentMethodLabel(doc.modePaiement)}</p>
    );
  }
  return (
    <p className={styles.modePaiement + ' ' + (styles.modePaiementPlaceholder || '')}>
      Mode de paiement : — (affiché sur les factures)
    </p>
  );
}

function BlockFooter({ options }) {
  if (!options.showFooter) return null;
  return (
    <footer className={styles.docFooter}>
      <p>{options.footerText || 'Document généré par SVFac'}</p>
    </footer>
  );
}

function DocumentContent({ doc, company, client, template }) {
  const { blockOrder, options } = template;
  const topRowOrder = blockOrder.filter((id) => id === 'company' || id === 'header');
  const topRowBlocks = topRowOrder.map((blockId) =>
    blockId === 'company' ? (
      <BlockCompany key="company" company={company} options={options} />
    ) : (
      <BlockHeader key="header" doc={doc} client={client} />
    )
  );

  return (
    <div className={styles.doc}>
      {topRowBlocks.length >= 2 ? (
        <div className={styles.docTopRow}>
          {topRowBlocks[0]}
          {topRowBlocks[1]}
        </div>
      ) : topRowBlocks.length === 1 ? (
        <div className={styles.docTopRow}>{topRowBlocks[0]}</div>
      ) : null}
      {blockOrder.filter((id) => id !== 'company' && id !== 'header').map((blockId) => {
        if (blockId === 'notes') return <BlockNotes key="notes" doc={doc} />;
        if (blockId === 'date') return <BlockDate key="date" doc={doc} />;
        if (blockId === 'lines') return <BlockLines key="lines" doc={doc} options={options} />;
        if (blockId === 'totals') return <BlockTotals key="totals" doc={doc} options={options} />;
        if (blockId === 'amountLetters') return <BlockAmountLetters key="amountLetters" doc={doc} />;
        if (blockId === 'payment') return <BlockPayment key="payment" doc={doc} />;
        if (blockId === 'footer') return <BlockFooter key="footer" options={options} />;
        return null;
      })}
    </div>
  );
}

function BlockRenderer({ blockId, doc, company, client, options }) {
  switch (blockId) {
    case 'company':
      return <BlockCompany company={company} options={options} />;
    case 'header':
      return <BlockHeader doc={doc} client={client} />;
    case 'notes':
      return <BlockNotes doc={doc} />;
    case 'date':
      return <BlockDate doc={doc} />;
    case 'lines':
      return <BlockLines doc={doc} options={options} />;
    case 'totals':
      return <BlockTotals doc={doc} options={options} />;
    case 'amountLetters':
      return <BlockAmountLetters doc={doc} />;
    case 'payment':
      return <BlockPayment doc={doc} />;
    case 'footer':
      return <BlockFooter options={options} />;
    default:
      return null;
  }
}

export { DocumentContent, BlockRenderer };
export default function DocumentPrint({ store, doc, onClose }) {
  const frameRef = useRef(null);

  useEffect(() => {
    const handleEscape = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const client = doc.client || {};
  const company = doc.company || {};
  const template = getTemplate(store);
  const content = <DocumentContent doc={doc} company={company} client={client} template={template} />;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.toolbar}>
          <button type="button" className="btn btn-ghost" onClick={onClose}>
            <X size={20} /> Fermer
          </button>
          <button type="button" className="btn btn-primary" onClick={() => window.print()}>
            Imprimer / Enregistrer en PDF
          </button>
        </div>
        <div className={styles.printArea} ref={frameRef}>
          {content}
        </div>
      </div>
    </div>
  );
}
