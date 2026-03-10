/**
 * Calcul des totaux pour une ligne (HT, TVA, TTC)
 */
export function lineTotals(line, tvaRateDefault = 0) {
  const qty = Number(line.quantity) || 0;
  const puHT = Number(line.priceHT ?? line.price) || 0;
  const tva = line.tva != null ? Number(line.tva) : tvaRateDefault;
  const totalHT = qty * puHT;
  const totalTVA = totalHT * (tva / 100);
  const totalTTC = totalHT + totalTVA;
  return { totalHT, totalTVA, totalTTC, tva };
}

/**
 * Calcul des totaux du document (somme des lignes + frais de port + acompte)
 */
export function documentTotals(lines, options = {}, tvaRateDefault = 0) {
  let totalHT = 0;
  let totalTVA = 0;
  const byTva = {};

  (lines || []).forEach((line) => {
    const { totalHT: lHT, totalTVA: lTVA, tva } = lineTotals(line, tvaRateDefault);
    totalHT += lHT;
    totalTVA += lTVA;
    byTva[tva] = (byTva[tva] || 0) + lTVA;
  });

  const fraisPort = Number(options.fraisPort) || 0;
  const acompte = Number(options.acompte) || 0;
  totalHT += fraisPort;
  const totalTTC = totalHT + totalTVA;
  const totalTTCFinal = totalTTC - acompte;

  return {
    totalHT,
    totalTVA,
    totalTTC: totalTTCFinal,
    fraisPort,
    acompte,
    byTva,
  };
}

/**
 * Créer une ligne à partir d'un produit
 */
export function lineFromProduct(product, quantity = 1, tvaRateDefault = 0) {
  const priceHT = product.priceHT ?? product.price ?? 0;
  const tva = product.tva != null ? product.tva : tvaRateDefault;
  const qty = Number(quantity) || 1;
  const { totalHT, totalTVA, totalTTC } = lineTotals(
    { quantity: qty, priceHT, tva },
    tvaRateDefault
  );
  return {
    description: product.name,
    reference: product.reference,
    quantity: qty,
    unit: product.unit || 'u',
    priceHT,
    tva,
    totalHT,
    totalTVA,
    totalTTC,
  };
}

/**
 * Recalcul des totaux de toutes les lignes
 */
export function recalcLines(lines, tvaRateDefault = 0) {
  return (lines || []).map((line) => {
    const { totalHT, totalTVA, totalTTC, tva } = lineTotals(line, tvaRateDefault);
    return {
      ...line,
      tva,
      totalHT,
      totalTVA,
      totalTTC,
    };
  });
}
