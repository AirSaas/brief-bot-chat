export function handleGoBack(onGoBack?: () => void): void {
  if (onGoBack) {
    onGoBack();
    return;
  }

  if (typeof window !== "undefined") {
    window.history.back();
  }
}

export async function handleCopyLink(targetUrl?: string): Promise<void> {
  if (typeof navigator === "undefined" || !navigator.clipboard) {
    return;
  }

  const urlToCopy = targetUrl ?? (typeof window !== "undefined" ? window.location.href : "");

  if (!urlToCopy) {
    return;
  }

  try {
    await navigator.clipboard.writeText(urlToCopy);
  } catch {
    // swallow clipboard errors silently to preserve UX
  }
}

