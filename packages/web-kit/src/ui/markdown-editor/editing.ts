/** Parses a trimmed, single-line HTTP(S) URL. */
function parseHttpUrl(text: string): URL | null {
  const candidate = text.trim();
  if (!/^https?:\/\/\S+$/i.test(candidate)) return null;
  try {
    return new URL(candidate);
  } catch {
    return null;
  }
}

function buildMarkdownLink(selection: string, url: URL): string | null {
  if (!selection || /[\r\n]/.test(selection)) return null;
  const label = selection.replace(/[\\[\]]/g, '\\$&');
  const destination = url.href.replace(/[()]/g, (character) =>
    character === '(' ? '%28' : '%29',
  );
  return `[${label}](${destination})`;
}

/** Builds a link for a nonempty, single-line label that is not itself a URL. */
export function createMarkdownLink(
  selection: string,
  clipboardText: string,
): string | null {
  const url = parseHttpUrl(clipboardText);
  if (!url || parseHttpUrl(selection)) return null;
  return buildMarkdownLink(selection, url);
}

function canInsert(element: HTMLTextAreaElement, text: string): boolean {
  return (
    !element.disabled &&
    !element.readOnly &&
    (element.maxLength < 0 ||
      element.value.length -
        (element.selectionEnd - element.selectionStart) +
        text.length <=
        element.maxLength)
  );
}

/** Shares undo-preserving insertion and exactly-once input notification. */
function insertText(
  element: HTMLTextAreaElement,
  text: string,
  allowFallback: boolean,
  onSuccess?: () => void,
): boolean {
  const document = element.ownerDocument;
  if (document.activeElement !== element || !canInsert(element, text))
    return false;

  const { selectionStart, selectionEnd } = element;
  let inputFired = false;
  const markInput = () => {
    inputFired = true;
  };
  let succeeded = false;
  element.addEventListener('input', markInput);
  try {
    if (typeof document.execCommand === 'function') {
      try {
        succeeded = document.execCommand('insertText', false, text);
      } catch {
        // Browsers may expose execCommand without supporting insertText.
      }
    }
    if (!succeeded && allowFallback) {
      element.setRangeText(text, selectionStart, selectionEnd, 'end');
      succeeded = true;
    }
  } catch {
    return false;
  } finally {
    element.removeEventListener('input', markInput);
  }
  if (!succeeded) return false;

  onSuccess?.();
  if (!inputFired) {
    const EventConstructor = document.defaultView?.Event ?? Event;
    element.dispatchEvent(new EventConstructor('input', { bubbles: true }));
  }
  return true;
}

/**
 * Focuses the textarea and replaces its selection, respecting editability and
 * maxlength. Uses execCommand for undo support, then setRangeText if unavailable.
 */
export function insertMarkdownText(
  element: HTMLTextAreaElement,
  text: string,
): boolean {
  if (!canInsert(element, text)) return false;
  try {
    element.focus();
  } catch {
    return false;
  }
  return insertText(element, text, true);
}

/**
 * Linkifies a URL pasted over selected text, or replaces a selected URL as-is.
 * Only prevents native paste after execCommand succeeds; never uses a fallback
 * that would lose the browser's native paste/undo behavior.
 */
export function handleMarkdownLinkPaste(
  event: ClipboardEvent,
  element: HTMLTextAreaElement | null | undefined,
): boolean {
  if (
    event.defaultPrevented ||
    !element ||
    element.disabled ||
    element.readOnly
  )
    return false;
  const { selectionStart, selectionEnd, value } = element;
  const clipboardText = event.clipboardData?.getData('text/plain');
  const clipboardUrl = clipboardText ? parseHttpUrl(clipboardText) : null;
  if (!clipboardUrl || selectionStart === selectionEnd) return false;

  const selection = value.slice(selectionStart, selectionEnd);
  const inserted = parseHttpUrl(selection)
    ? clipboardText
    : buildMarkdownLink(selection, clipboardUrl);
  if (!inserted) return false;
  return insertText(element, inserted, false, () => event.preventDefault());
}
