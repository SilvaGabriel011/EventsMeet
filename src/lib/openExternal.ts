/**
 * Opens an external link in the user's real browser.
 *
 * Inside an installed iOS PWA (standalone mode), plain target="_blank" links
 * open in the cut-down in-app browser overlay. Rewriting the scheme to
 * x-safari-https:// hands the URL to real Safari instead. The scheme is
 * unsupported on a few iOS versions (notably iOS 16) — in that case nothing
 * happens and the page stays visible, so we fall back to the in-app browser
 * after a beat.
 */
export function openExternal(url: string): void {
  const isIOSStandalone =
    typeof navigator !== "undefined" &&
    (navigator as unknown as { standalone?: boolean }).standalone === true;

  if (isIOSStandalone && /^https:\/\//.test(url)) {
    window.location.href = `x-safari-${url}`;
    setTimeout(() => {
      if (!document.hidden) window.open(url, "_blank", "noopener");
    }, 800);
    return;
  }
  window.open(url, "_blank", "noopener");
}
