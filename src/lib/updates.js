/**
 * Vérification des mises à jour via GitHub Releases.
 * Modifier GITHUB_REPO si votre dépôt est différent.
 */
const GITHUB_REPO = 'Studio-Velysion/SVFac';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`;

const IGNORED_UPDATE_KEY = 'svfac-ignored-update-version';

function parseVersion(s) {
  const v = String(s || '').replace(/^v/, '').trim();
  const parts = v.split('.').map((n) => parseInt(n, 10) || 0);
  return { major: parts[0] || 0, minor: parts[1] || 0, patch: parts[2] || 0 };
}

function isNewer(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);
  if (a.major !== b.major) return a.major > b.major;
  if (a.minor !== b.minor) return a.minor > b.minor;
  return a.patch > b.patch;
}

/**
 * Récupère la version actuelle de l'app (injectée au build).
 */
export function getCurrentVersion() {
  return typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0';
}

/**
 * Vérifie si une mise à jour est disponible.
 * @returns {Promise<{ available: boolean, version?: string, url?: string, body?: string }>}
 */
export async function checkForUpdate() {
  const current = getCurrentVersion();
  try {
    const res = await fetch(GITHUB_API, {
      headers: { Accept: 'application/vnd.github.v3+json' },
    });
    if (!res.ok) return { available: false };
    const data = await res.json();
    const latest = data.tag_name || data.name || '';
    const version = latest.replace(/^v/, '').trim();
    if (!version || !isNewer(version, current)) return { available: false };
    const url = data.html_url || (data.assets?.[0]?.browser_download_url) || `https://github.com/${GITHUB_REPO}/releases`;
    return {
      available: true,
      version,
      url,
      body: data.body || '',
    };
  } catch (_) {
    return { available: false };
  }
}

export function getIgnoredUpdateVersion() {
  try {
    return localStorage.getItem(IGNORED_UPDATE_KEY) || null;
  } catch (_) {
    return null;
  }
}

export function setIgnoredUpdateVersion(version) {
  try {
    if (version) localStorage.setItem(IGNORED_UPDATE_KEY, version);
    else localStorage.removeItem(IGNORED_UPDATE_KEY);
  } catch (_) {}
}
