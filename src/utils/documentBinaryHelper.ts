/**
 * Document Binary and Download Helper
 */

export function downloadOriginalFile(name: string, dataUrl?: string, metadata?: { kpiName?: string; refNum?: string; quarter?: string; mimeType?: string }) {
  if (!dataUrl) {
    console.warn("downloadOriginalFile called without dataUrl");
    return;
  }
  try {
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name || (metadata?.kpiName ? `${metadata.kpiName}-evidence` : 'evidence-document');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (err) {
    console.error("Failed to download file:", err);
  }
}
