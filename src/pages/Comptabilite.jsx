import { useState, useMemo } from 'react';
import { UserPlus, TrendingUp, TrendingDown, Wallet, Trash2, Edit2, X, Receipt, Calculator, Download, FileSpreadsheet, BookOpen, BarChart3 } from 'lucide-react';
import { PAYMENT_METHODS, getPaymentMethodLabel } from '../lib/paymentMethods';
import styles from './Comptabilite.module.css';

const CATEGORIES_RECETTE = ['Recette totale', 'Factures totales', 'Vente', 'Facturation', 'Avoir réglé', 'Espèces', 'Virement', 'Carte bancaire', 'Autre'];
const CATEGORIES_DEPENSE = ['Fournisseur', 'Salaires', 'Loyer', 'Matériel', 'Autre'];
const RAPPROCHEMENT_NOTE_PREFIX = 'Rapprochement factures';

export default function Comptabilite({ store }) {
  const { state, addComptabilityEntry, updateComptabilityEntry, deleteComptabilityEntry } = store;
  const entries = state.comptabilityEntries || [];
  const factures = state.factures || [];
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterMonth, setFilterMonth] = useState('');
  const [activeTab, setActiveTab] = useState('ecritures');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    type: 'income',
    clientName: '',
    label: '',
    amount: '',
    category: '',
    modePaiement: '',
    entry_date: new Date().toISOString().slice(0, 10),
  });

  const filtered = useMemo(() => {
    return entries.filter((e) => {
      const d = e.entry_date ? e.entry_date.slice(0, 7) : '';
      const [y, m] = d.split('-');
      if (filterYear && y !== String(filterYear)) return false;
      if (filterMonth && m !== String(filterMonth).padStart(2, '0')) return false;
      return true;
    });
  }, [entries, filterYear, filterMonth]);

  const summary = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    filtered.forEach((e) => {
      const a = Number(e.amount) || 0;
      if (e.type === 'income') totalIncome += a;
      else totalExpense += a;
    });
    return {
      totalIncome,
      totalExpense,
      balance: totalIncome - totalExpense,
    };
  }, [filtered]);

  const facturesFiltrees = useMemo(() => {
    return factures.filter((f) => {
      const d = f.date ? String(f.date).slice(0, 7) : '';
      const [y, m] = d.split('-');
      if (filterYear && y !== String(filterYear)) return false;
      if (filterMonth && m !== String(filterMonth).padStart(2, '0')) return false;
      return true;
    }).sort((a, b) => new Date(b.createdAt || b.date) - new Date(a.createdAt || a.date));
  }, [factures, filterYear, filterMonth]);

  const { caPaye, caTotalFactures } = useMemo(() => {
    let paye = 0;
    let total = 0;
    facturesFiltrees.forEach((f) => {
      const t = Number(f.totalTTC) || 0;
      total += t;
      if (f.status === 'reglee') paye += t;
    });
    return { caPaye: paye, caTotalFactures: total };
  }, [facturesFiltrees]);

  /* Grand livre : regroupement par catégorie avec débit/crédit */
  const ledgerByCategory = useMemo(() => {
    const groups = {};
    filtered.forEach((e) => {
      const cat = e.category?.trim() || 'Non catégorisé';
      if (!groups[cat]) groups[cat] = { entries: [], debit: 0, credit: 0 };
      groups[cat].entries.push(e);
      const amt = Number(e.amount) || 0;
      if (e.type === 'expense') {
        groups[cat].debit += amt;
      } else {
        groups[cat].credit += amt;
      }
    });
    return Object.entries(groups).map(([name, data]) => ({ name, ...data }));
  }, [filtered]);

  /* Compte de résultat : totaux par catégorie */
  const compteResultat = useMemo(() => {
    const incomeByCat = {};
    const expenseByCat = {};
    filtered.forEach((e) => {
      const cat = e.category?.trim() || 'Non catégorisé';
      const amt = Number(e.amount) || 0;
      if (e.type === 'income') {
        incomeByCat[cat] = (incomeByCat[cat] || 0) + amt;
      } else {
        expenseByCat[cat] = (expenseByCat[cat] || 0) + amt;
      }
    });
    return {
      income: Object.entries(incomeByCat).map(([name, total]) => ({ name, total })),
      expense: Object.entries(expenseByCat).map(([name, total]) => ({ name, total })),
    };
  }, [filtered]);

  const getLastDayOfPeriod = () => {
    const y = filterYear || new Date().getFullYear();
    const m = filterMonth ? Number(filterMonth) : 12;
    const last = new Date(y, m, 0);
    return last.toISOString().slice(0, 10);
  };

  const getRapprochementPeriodLabel = () => {
    if (filterMonth) {
      const m = Number(filterMonth);
      const monthName = new Date(2000, m - 1).toLocaleString('fr-FR', { month: 'long' });
      return `${monthName} ${filterYear}`;
    }
    return String(filterYear);
  };

  const handleRapprochement = () => {
    const periodLabel = getRapprochementPeriodLabel();
    if (caTotalFactures <= 0 && caPaye <= 0) {
      window.alert('Aucune facture pour cette période. Rien à saisir.');
      return;
    }
    if (!window.confirm(`Créer les écritures « Recette totale » et « Factures totales » pour ${periodLabel} ? Les anciennes écritures de rapprochement de cette période seront remplacées.`)) return;
    const dateStr = getLastDayOfPeriod();
    const toDelete = entries.filter((e) => {
      const d = e.entry_date ? e.entry_date.slice(0, 7) : '';
      const [ey, em] = d.split('-');
      const samePeriod = ey === String(filterYear) && (filterMonth ? em === String(filterMonth).padStart(2, '0') : true);
      const isRapprochement = (e.note || '').startsWith(RAPPROCHEMENT_NOTE_PREFIX);
      return samePeriod && isRapprochement;
    });
    toDelete.forEach((e) => deleteComptabilityEntry(e.id));
    const note = `${RAPPROCHEMENT_NOTE_PREFIX} ${periodLabel}`;
    if (caPaye > 0) {
      addComptabilityEntry({
        type: 'income',
        amount: caPaye,
        label: 'Recette totale',
        category: 'Recette totale',
        entry_date: dateStr,
        note,
      });
    }
    if (caTotalFactures > 0) {
      addComptabilityEntry({
        type: 'income',
        amount: caTotalFactures,
        label: 'Factures totales',
        category: 'Factures totales',
        entry_date: dateStr,
        note,
      });
    }
  };

  const openCreate = () => {
    setEditingId(null);
    setForm({
      type: 'income',
      clientName: '',
      label: '',
      amount: '',
      category: '',
      modePaiement: '',
      entry_date: new Date().toISOString().slice(0, 10),
    });
    setModalOpen(true);
  };

  const openEdit = (entry) => {
    setEditingId(entry.id);
    setForm({
      type: entry.type,
      clientName: entry.clientName || '',
      label: entry.label || '',
      amount: String(entry.amount ?? ''),
      category: entry.category || '',
      modePaiement: entry.modePaiement || '',
      entry_date: entry.entry_date ? entry.entry_date.slice(0, 10) : '',
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) return;
    const designation = form.label.trim();
    if (!designation) return;
    const clientName = form.clientName.trim();
    const payload = {
      type: form.type,
      amount,
      label: designation,
      ...(form.type === 'income' && clientName ? { clientName } : {}),
      category: form.category.trim() || undefined,
      modePaiement: form.modePaiement || undefined,
      entry_date: form.entry_date,
    };
    if (editingId) {
      updateComptabilityEntry(editingId, payload);
    } else {
      addComptabilityEntry(payload);
    }
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm('Supprimer cette écriture ?')) deleteComptabilityEntry(id);
  };

  const handleExportExcel = () => {
    const headers = ['Date', 'Libellé', 'Catégorie', 'Mode de paiement', 'Type', 'Montant', 'Devise'];
    const rows = filtered.map((e) => [
      e.entry_date || '',
      e.clientName ? `${e.clientName} - ${e.label || ''}` : (e.label || ''),
      e.category || '',
      getPaymentMethodLabel(e.modePaiement) || '',
      e.type === 'income' ? 'Recette' : 'Dépense',
      String(Number(e.amount || 0).toFixed(2)),
      devise,
    ]);
    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comptabilite-${filterYear}${filterMonth ? `-${String(filterMonth).padStart(2, '0')}` : ''}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportPdf = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    const periodLabel = filterMonth ? `${new Date(2000, Number(filterMonth) - 1).toLocaleString('fr-FR', { month: 'long' })} ${filterYear}` : String(filterYear);
    printWindow.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Comptabilité ${periodLabel}</title>
      <style>body{font-family:Segoe UI,sans-serif;padding:2rem;color:#333} table{border-collapse:collapse;width:100%;margin-top:1rem} th,td{border:1px solid #ddd;padding:8px;text-align:left} th{background:#f5f5f5} .recette{color:green} .depense{color:red}</style></head><body>
      <h1>Comptabilité — ${periodLabel}</h1>
      <p>Recettes : ${summary.totalIncome.toFixed(2)} ${devise} | Dépenses : ${summary.totalExpense.toFixed(2)} ${devise} | Solde : ${summary.balance.toFixed(2)} ${devise}</p>
      <table><thead><tr><th>Date</th><th>Libellé</th><th>Catégorie</th><th>Mode paiement</th><th>Montant</th></tr></thead><tbody>
      ${filtered.map((e) => {
      const libelle = e.clientName ? `${e.clientName} - ${e.label || ''}` : (e.label || '');
      return `<tr><td>${e.entry_date ? new Date(e.entry_date).toLocaleDateString('fr-FR') : '—'}</td><td>${(libelle).replace(/</g, '&lt;')}</td><td>${(e.category || '—').replace(/</g, '&lt;')}</td><td>${(getPaymentMethodLabel(e.modePaiement) || '—').replace(/</g, '&lt;')}</td><td class="${e.type === 'income' ? 'recette' : 'depense'}">${e.type === 'income' ? '+' : '-'}${Number(e.amount || 0).toFixed(2)} ${devise}</td></tr>`;
    }).join('')}
      </tbody></table></body></html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); printWindow.close(); }, 300);
  };

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: '', label: 'Tous les mois' },
    ...Array.from({ length: 12 }, (_, i) => ({
      value: i + 1,
      label: new Date(2000, i).toLocaleString('fr-FR', { month: 'long' }),
    })),
  ];
  const devise = state.settings?.devise || '€';

  return (
    <div className={styles.page}>
      <div className="page-header">
        <h1 className="page-title">Comptabilité</h1>
      </div>
      <div className={styles.toolbar}>
        <div className={styles.toolbarGroup}>
          <span className={styles.toolbarLabel}>Période</span>
          <select className={styles.toolbarSelect} value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <select className={styles.toolbarSelect} value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)}>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
        <div className={styles.toolbarActions}>
          <button type="button" className={styles.btnRapprochement} onClick={handleRapprochement} title="Créer les écritures Recette totale et Factures totales pour la période">
            <Calculator size={18} /> Saisir les totaux factures
          </button>
          <button type="button" className={styles.btnPaiement} onClick={() => setShowPaiement(true)}>
            <Wallet size={18} /> Paiement client
          </button>
        </div>
      </div>
      <p className={styles.hint}>
        Saisir les totaux factures crée deux écritures (Recette totale + Factures totales) pour la période. Pour les encaissements sans facture, utilisez « Paiement client » (nom du client, désignation, montant, mode de paiement).
      </p>
      <div className={styles.tabs}>
        <button type="button" className={`${styles.tab} ${activeTab === 'ecritures' ? styles.tabActive : ''}`} onClick={() => setActiveTab('ecritures')}>
          <Receipt size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Écritures
        </button>
        <button type="button" className={`${styles.tab} ${activeTab === 'grand-livre' ? styles.tabActive : ''}`} onClick={() => setActiveTab('grand-livre')}>
          <BookOpen size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Grand livre
        </button>
        <button type="button" className={`${styles.tab} ${activeTab === 'compte-resultat' ? styles.tabActive : ''}`} onClick={() => setActiveTab('compte-resultat')}>
          <BarChart3 size={18} style={{ verticalAlign: 'middle', marginRight: 6 }} /> Compte de résultat
        </button>
      </div>
      <div className={styles.cardsGrid}>
        <div className={styles.cardCompta}>
          <div className={styles.cardComptaIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}>
            <Receipt size={22} />
          </div>
          <div className={styles.cardComptaLabel}>Chiffre d&apos;affaires</div>
          <p className={styles.cardComptaValue} style={{ color: 'var(--color-success)' }}>{caPaye.toFixed(2)} {devise}</p>
          <p className={styles.cardComptaSub}>Factures réglées</p>
        </div>
        <div className={styles.cardCompta}>
          <div className={styles.cardComptaIcon} style={{ background: 'rgba(168, 85, 247, 0.2)', color: 'var(--color-secondary)' }}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.cardComptaLabel}>CA total factures</div>
          <p className={styles.cardComptaValue} style={{ color: 'var(--color-secondary)' }}>{caTotalFactures.toFixed(2)} {devise}</p>
          <p className={styles.cardComptaSub}>Toutes factures</p>
        </div>
        <div className={styles.cardCompta}>
          <div className={styles.cardComptaIcon} style={{ background: 'rgba(16, 185, 129, 0.2)', color: 'var(--color-success)' }}>
            <TrendingUp size={22} />
          </div>
          <div className={styles.cardComptaLabel}>Recettes</div>
          <p className={styles.cardComptaValue} style={{ color: 'var(--color-success)' }}>{summary.totalIncome.toFixed(2)} {devise}</p>
        </div>
        <div className={styles.cardCompta}>
          <div className={styles.cardComptaIcon} style={{ background: 'rgba(239, 68, 68, 0.2)', color: 'var(--color-danger)' }}>
            <TrendingDown size={22} />
          </div>
          <div className={styles.cardComptaLabel}>Dépenses</div>
          <p className={styles.cardComptaValue} style={{ color: 'var(--color-danger)' }}>{summary.totalExpense.toFixed(2)} {devise}</p>
        </div>
        <div className={styles.cardCompta}>
          <div className={styles.cardComptaIcon} style={{ background: 'rgba(124, 58, 237, 0.2)', color: 'var(--color-primary)' }}>
            <Wallet size={22} />
          </div>
          <div className={styles.cardComptaLabel}>Solde</div>
          <p className={styles.cardComptaValue} style={{ color: summary.balance >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
            {summary.balance.toFixed(2)} {devise}
          </p>
        </div>
      </div>

      {activeTab === 'ecritures' && (
      <div className={styles.contentCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Écritures</h2>
          {filtered.length > 0 && (
            <div className={styles.sectionActions}>
              <button type="button" className="btn btn-ghost" onClick={handleExportPdf} title="Télécharger en PDF">
                <Download size={18} /> PDF
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleExportExcel} title="Télécharger en Excel (CSV)">
                <FileSpreadsheet size={18} /> Excel
              </button>
            </div>
          )}
        </div>
        {filtered.length === 0 ? (
          <p className={styles.emptyState}>Aucune écriture pour cette période.</p>
        ) : (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Libellé</th>
                  <th>Catégorie</th>
                  <th>Mode de paiement</th>
                  <th style={{ textAlign: 'right' }}>Montant</th>
                  <th style={{ width: 100 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td>{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('fr-FR') : '—'}</td>
                    <td>{entry.clientName ? `${entry.clientName} - ${entry.label || ''}` : (entry.label || '—')}</td>
                    <td>{entry.category || '—'}</td>
                    <td>{getPaymentMethodLabel(entry.modePaiement) || '—'}</td>
                    <td className={entry.type === 'income' ? styles.amountPositive : styles.amountNegative}>
                      {entry.type === 'income' ? '+' : '-'}{Number(entry.amount).toFixed(2)} {devise}
                    </td>
                    <td>
                      <div className={styles.cellActions}>
                        <button type="button" className="btn btn-ghost" onClick={() => openEdit(entry)} title="Modifier">
                          <Edit2 size={14} />
                        </button>
                        <button type="button" className="btn btn-ghost" onClick={() => handleDelete(entry.id)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      )}

      {activeTab === 'grand-livre' && (
        <div className={styles.ledgerSection}>
          <h2 className={styles.sectionTitle}>Grand livre (par catégorie)</h2>
          {ledgerByCategory.length === 0 ? (
            <p className={styles.emptyState}>Aucune écriture pour cette période.</p>
          ) : (
            ledgerByCategory.map(({ name, entries: groupEntries, debit, credit }) => (
              <div key={name} className={styles.ledgerAccount}>
                <div className={styles.ledgerAccountHeader}>{name}</div>
                <table className={styles.ledgerTable}>
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Libellé</th>
                      <th>Mode paiement</th>
                      <th className={styles.debit}>Débit</th>
                      <th className={styles.credit}>Crédit</th>
                    </tr>
                  </thead>
                  <tbody>
                    {groupEntries.sort((a, b) => (a.entry_date || '').localeCompare(b.entry_date || '')).map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString('fr-FR') : '—'}</td>
                        <td>{entry.clientName ? `${entry.clientName} - ${entry.label || ''}` : (entry.label || '—')}</td>
                        <td>{getPaymentMethodLabel(entry.modePaiement) || '—'}</td>
                        <td className={styles.debit}>{entry.type === 'expense' ? `${Number(entry.amount || 0).toFixed(2)} ${devise}` : '—'}</td>
                        <td className={styles.credit}>{entry.type === 'income' ? `${Number(entry.amount || 0).toFixed(2)} ${devise}` : '—'}</td>
                      </tr>
                    ))}
                    <tr className={styles.totalRow}>
                      <td colSpan={3}>Total</td>
                      <td className={styles.debit}>{debit > 0 ? `${debit.toFixed(2)} ${devise}` : '—'}</td>
                      <td className={styles.credit}>{credit > 0 ? `${credit.toFixed(2)} ${devise}` : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'compte-resultat' && (
        <div className={styles.reportCard} style={{ maxWidth: 560 }}>
          <div className={`${styles.reportCardTitle} ${styles.income}`}>Recettes par catégorie</div>
          <div className={styles.reportRows}>
            {compteResultat.income.length === 0 ? (
              <div className={styles.reportRow}>Aucune recette</div>
            ) : (
              compteResultat.income.map(({ name, total }) => (
                <div key={name} className={styles.reportRow}>
                  <span>{name}</span>
                  <span style={{ color: 'var(--color-success)', fontWeight: 600 }}>{total.toFixed(2)} {devise}</span>
                </div>
              ))
            )}
            <div className={styles.reportRowTotal}>
              <span>Total recettes</span>
              <span style={{ color: 'var(--color-success)' }}>{summary.totalIncome.toFixed(2)} {devise}</span>
            </div>
          </div>
          <div className={`${styles.reportCardTitle} ${styles.expense}`} style={{ marginTop: '1rem' }}>Dépenses par catégorie</div>
          <div className={styles.reportRows}>
            {compteResultat.expense.length === 0 ? (
              <div className={styles.reportRow}>Aucune dépense</div>
            ) : (
              compteResultat.expense.map(({ name, total }) => (
                <div key={name} className={styles.reportRow}>
                  <span>{name}</span>
                  <span style={{ color: 'var(--color-danger)', fontWeight: 600 }}>{total.toFixed(2)} {devise}</span>
                </div>
              ))
            )}
            <div className={styles.reportRowTotal}>
              <span>Total dépenses</span>
              <span style={{ color: 'var(--color-danger)' }}>{summary.totalExpense.toFixed(2)} {devise}</span>
            </div>
          </div>
          <div className={`${styles.reportResult} ${summary.balance >= 0 ? styles.positive : styles.negative}`}>
            Résultat : {summary.balance >= 0 ? '+' : ''}{summary.balance.toFixed(2)} {devise}
          </div>
        </div>
      )}

      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div className="card" style={{ maxWidth: 420, width: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0 }}>{editingId ? 'Modifier l\'écriture' : 'Paiement client'}</h3>
              <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="label">Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="income">Recette (paiement reçu)</option>
                  <option value="expense">Dépense</option>
                </select>
              </div>
              {form.type === 'income' && (
                <div>
                  <label className="label">Nom du client</label>
                  <input
                    type="text"
                    className="input"
                    value={form.clientName}
                    onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))}
                    placeholder="Ex. Jean Dupont, Société ABC..."
                  />
                </div>
              )}
              <div>
                <label className="label">Désignation (ce que le client a acheté) *</label>
                <input
                  type="text"
                  className="input"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                  placeholder="Ex. Prestation conseil, Vente produit..."
                />
              </div>
              <div>
                <label className="label">Montant ({devise}) *</label>
                <input
                  type="text"
                  className="input"
                  value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="label">Catégorie</label>
                <select
                  className="input"
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                >
                  <option value="">—</option>
                  {(form.type === 'income' ? CATEGORIES_RECETTE : CATEGORIES_DEPENSE).map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Comment le client a payé</label>
                <select
                  className="input"
                  value={form.modePaiement}
                  onChange={(e) => setForm((f) => ({ ...f, modePaiement: e.target.value }))}
                >
                  <option value="">—</option>
                  {PAYMENT_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  className="input"
                  value={form.entry_date}
                  onChange={(e) => setForm((f) => ({ ...f, entry_date: e.target.value }))}
                />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="submit" className="btn btn-primary">
                  {editingId ? 'Enregistrer' : 'Enregistrer le paiement'}
                </button>
                <button type="button" className="btn btn-ghost" onClick={() => setModalOpen(false)}>
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
