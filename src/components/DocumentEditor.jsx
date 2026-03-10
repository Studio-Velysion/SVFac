import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Search } from 'lucide-react';
import { documentTotals, lineFromProduct, lineTotals, recalcLines } from '../lib/documentUtils';
import styles from './DocumentEditor.module.css';

const emptyLine = {
  description: '',
  quantity: 1,
  unit: 'u',
  priceHT: 0,
  tva: null,
};

export default function DocumentEditor({
  lines: initialLines = [],
  onChangeLines,
  products = [],
  tvaRateDefault = 0,
  tvaApplicable = true,
  showUnits = true,
  devise = '€',
  fraisPort = 0,
  acompte = 0,
  onFraisPortChange,
  onAcompteChange,
  readOnly = false,
}) {
  const [searchProduct, setSearchProduct] = useState('');
  const [showProductSearch, setShowProductSearch] = useState(false);
  const [fraisPortStr, setFraisPortStr] = useState(() => String(fraisPort));
  const [acompteStr, setAcompteStr] = useState(() => String(acompte));
  /** Édition en cours : garde la chaîne tapée (ex. "20.") pour accepter le point du pavé numérique */
  const [editingCell, setEditingCell] = useState(null);

  useEffect(() => {
    setFraisPortStr(String(fraisPort));
  }, [fraisPort]);
  useEffect(() => {
    setAcompteStr(String(acompte));
  }, [acompte]);

  const lines = useMemo(
    () => recalcLines(initialLines, tvaRateDefault),
    [initialLines, tvaRateDefault]
  );

  const totals = useMemo(
    () => documentTotals(lines, { fraisPort, acompte }, tvaRateDefault),
    [lines, fraisPort, acompte, tvaRateDefault]
  );

  const filteredProducts = useMemo(() => {
    const q = searchProduct.toLowerCase();
    return products.filter(
      (p) =>
        (p.name || '').toLowerCase().includes(q) ||
        (p.reference || '').toLowerCase().includes(q)
    );
  }, [products, searchProduct]);

  const addLine = () => {
    onChangeLines([...lines, { ...emptyLine, tva: tvaRateDefault }]);
  };

  const removeLine = (index) => {
    onChangeLines(lines.filter((_, i) => i !== index));
  };

  const updateLine = (index, field, value) => {
    const next = lines.map((l, i) =>
      i === index ? { ...l, [field]: value } : l
    );
    onChangeLines(recalcLines(next, tvaRateDefault));
  };

  /** Normalise séparateur décimal (point ou virgule) pour le parsing */
  const parseDecimal = (raw) => {
    const s = String(raw).trim().replace(',', '.');
    return s === '' ? NaN : parseFloat(s);
  };

  const isEditing = (rowIndex, field) =>
    editingCell?.rowIndex === rowIndex && editingCell?.field === field;
  const startEdit = (rowIndex, field, currentValue) =>
    setEditingCell({ rowIndex, field, value: currentValue === '' || currentValue == null ? '' : String(currentValue) });
  const updateEdit = (value) =>
    setEditingCell((prev) => (prev ? { ...prev, value } : null));
  const commitEdit = (rowIndex, field, str, options = {}) => {
    const n = parseDecimal(str);
    const { min = -Infinity, max = Infinity, emptyDefault = 0, onValid } = options;
    if (str.trim() === '') {
      updateLine(rowIndex, field, field === 'tva' ? tvaRateDefault : emptyDefault);
    } else if (!Number.isNaN(n) && n >= min && n <= max) {
      updateLine(rowIndex, field, n);
      onValid?.(n);
    }
    setEditingCell(null);
  };

  const addProductAsLine = (product, qty = 1) => {
    const line = lineFromProduct(product, qty, tvaRateDefault);
    onChangeLines(recalcLines([...lines, line], tvaRateDefault));
    setShowProductSearch(false);
    setSearchProduct('');
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <div className={styles.productSearch}>
          <Search size={18} />
          <input
            type="text"
            className="input"
            placeholder="Ajouter un produit de la base..."
            value={searchProduct}
            onChange={(e) => setSearchProduct(e.target.value)}
            onFocus={() => setShowProductSearch(true)}
          />
          {showProductSearch && filteredProducts.length > 0 && (
            <div className={styles.productDropdown}>
              {filteredProducts.slice(0, 8).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={styles.productItem}
                  onClick={() => addProductAsLine(p)}
                >
                  <span>{p.name}</span>
                  <span className={styles.productPrice}>
                    {(p.priceHT ?? p.price ?? 0).toFixed(2)} {devise} HT
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        {!readOnly && (
          <button type="button" className="btn btn-secondary" onClick={addLine}>
            <Plus size={18} /> Ligne libre
          </button>
        )}
      </div>

      <div className="table-wrap">
        <table className={styles.linesTable}>
          <thead>
            <tr>
              <th>Désignation</th>
              <th style={{ width: '80px' }}>Qté</th>
              {showUnits && <th style={{ width: '70px' }}>Unité</th>}
              <th style={{ width: '110px' }}>Prix unit. HT</th>
              {tvaApplicable && <th style={{ width: '70px' }}>TVA %</th>}
              <th style={{ width: '120px' }}>Total TTC</th>
              {!readOnly && <th style={{ width: '50px' }} />}
            </tr>
          </thead>
          <tbody>
            {lines.map((line, i) => (
              <tr key={i}>
                <td>
                  {readOnly ? (
                    line.description
                  ) : (
                    <input
                      type="text"
                      className="input input-sm"
                      value={line.description}
                      onChange={(e) => updateLine(i, 'description', e.target.value)}
                      placeholder="Désignation"
                    />
                  )}
                </td>
                <td>
                  {readOnly ? (
                    line.quantity
                  ) : (
                    <input
                      type="text"
                      inputMode="decimal"
                      className="input input-sm"
                      value={isEditing(i, 'quantity') ? editingCell.value : (line.quantity === 0 ? '' : String(line.quantity))}
                      onFocus={() => startEdit(i, 'quantity', line.quantity === 0 ? '' : line.quantity)}
                      onChange={(e) => updateEdit(e.target.value)}
                      onBlur={(e) => commitEdit(i, 'quantity', e.target.value, { min: 0, emptyDefault: 0 })}
                      placeholder="Qté"
                    />
                  )}
                </td>
                {showUnits && (
                  <td>
                    {readOnly ? (
                      line.unit
                    ) : (
                      <input
                        type="text"
                        className="input input-sm"
                        value={line.unit}
                        onChange={(e) => updateLine(i, 'unit', e.target.value)}
                        placeholder="u"
                      />
                    )}
                  </td>
                )}
                <td>
                  {readOnly ? (
                    `${Number(line.priceHT ?? line.price ?? 0).toFixed(2)} ${devise}`
                  ) : (
                    <input
                      type="text"
                      inputMode="decimal"
                      className="input input-sm"
                      value={isEditing(i, 'priceHT') ? editingCell.value : (line.priceHT ?? line.price ?? '')}
                      onFocus={() => startEdit(i, 'priceHT', line.priceHT ?? line.price ?? '')}
                      onChange={(e) => updateEdit(e.target.value)}
                      onBlur={(e) => commitEdit(i, 'priceHT', e.target.value, { min: 0, emptyDefault: 0 })}
                      placeholder="Prix HT"
                    />
                  )}
                </td>
                {tvaApplicable && (
                  <td>
                    {readOnly ? (
                      (line.tva != null ? `${line.tva} %` : `${tvaRateDefault} %`)
                    ) : (
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input input-sm"
                        style={{ width: '60px' }}
                        value={isEditing(i, 'tva') ? editingCell.value : (line.tva != null ? String(line.tva) : String(tvaRateDefault))}
                        onFocus={() => startEdit(i, 'tva', line.tva != null ? line.tva : tvaRateDefault)}
                        onChange={(e) => updateEdit(e.target.value)}
                        onBlur={(e) => commitEdit(i, 'tva', e.target.value, { min: 0, max: 100 })}
                        placeholder={String(tvaRateDefault)}
                      />
                    )}
                  </td>
                )}
                <td className={styles.total}>
                  {line.totalTTC != null
                    ? `${Number(line.totalTTC).toFixed(2)} ${devise}`
                    : '—'}
                </td>
                {!readOnly && (
                  <td>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => removeLine(i)}
                      title="Supprimer la ligne"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {lines.length > 0 && (
        <div className={styles.totals}>
          {!readOnly && (
            <>
              <div className={styles.totalRow}>
                <label className="label">Frais de port (HT)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input"
                  style={{ width: '120px' }}
                  value={fraisPortStr}
                  onChange={(e) => {
                    setFraisPortStr(e.target.value);
                    const raw = String(e.target.value).replace(',', '.');
                    const n = parseFloat(raw);
                    if (raw === '' || (!Number.isNaN(n) && n >= 0)) {
                      onFraisPortChange?.(raw === '' ? 0 : n);
                    }
                  }}
                  onBlur={() => setFraisPortStr(String(fraisPort))}
                  placeholder="0"
                />
              </div>
              <div className={styles.totalRow}>
                <label className="label">Acompte déduit (TTC)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  className="input"
                  style={{ width: '120px' }}
                  value={acompteStr}
                  onChange={(e) => {
                    setAcompteStr(e.target.value);
                    const raw = String(e.target.value).replace(',', '.');
                    const n = parseFloat(raw);
                    if (raw === '' || (!Number.isNaN(n) && n >= 0)) {
                      onAcompteChange?.(raw === '' ? 0 : n);
                    }
                  }}
                  onBlur={() => setAcompteStr(String(acompte))}
                  placeholder="0"
                />
              </div>
            </>
          )}
          <div className={styles.totalRow}>
            <span>Total HT</span>
            <strong>{totals.totalHT.toFixed(2)} {devise}</strong>
          </div>
          {tvaApplicable && (
            <div className={styles.totalRow}>
              <span>TVA</span>
              <strong>{totals.totalTVA.toFixed(2)} {devise}</strong>
            </div>
          )}
          <div className={styles.totalRow + ' ' + styles.totalTTC}>
            <span>Total TTC</span>
            <strong>{totals.totalTTC.toFixed(2)} {devise}</strong>
          </div>
        </div>
      )}
    </div>
  );
}
