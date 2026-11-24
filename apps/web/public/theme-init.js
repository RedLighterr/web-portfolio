// İlk boyamadan önce manuel tema tercihini uygular (prerender edilmiş sayfada tema flash'ını önler, bkz. docs/THEME.md).
// index.html <head>'inde CSS'ten önce, async/defer OLMADAN yüklenir. Harici dosya: CSP `script-src 'self'` yeterli.
// Anahtar src/lib/theme.ts THEME_STORAGE_KEY ile aynı olmalı (theme.test.ts denetler).
try {
  var theme = localStorage.getItem('theme')
  if (theme === 'light' || theme === 'dark') document.documentElement.dataset.theme = theme
} catch {
  // Depolama kapalı (gizli mod vb.): OS tercihi geçerli kalır.
}
