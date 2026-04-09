/**
 * Minimal plain-text message content renderer.
 * Slawk used Quill deltas with rich formatting; Srlko MVP uses plain text only.
 * URLs are auto-linked; newlines are preserved.
 */

const URL_REGEX = /(https?:\/\/[^\s<]+)/g;

export function renderMessageContent(content: string): React.ReactNode {
  if (!content) return null;

  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  let key = 0;

  content.replace(URL_REGEX, (url, _p1, offset) => {
    if (offset > lastIndex) {
      parts.push(content.substring(lastIndex, offset));
    }
    parts.push(
      <a
        key={key++}
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 hover:underline"
      >
        {url}
      </a>
    );
    lastIndex = offset + url.length;
    return url;
  });

  if (lastIndex < content.length) {
    parts.push(content.substring(lastIndex));
  }

  return <span className="whitespace-pre-wrap break-words">{parts}</span>;
}
