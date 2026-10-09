import React from 'react';

const MENTION_PATTERN = /@\[([^\]]+)\]\(([^)]+)\)/g;

export function CommentText({ text }) {
  if (!text) return null;
  const parts = [];
  const regex = new RegExp(MENTION_PATTERN.source, 'g');
  let lastIdx = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) parts.push({ type: 'text', content: text.slice(lastIdx, match.index) });
    parts.push({ type: 'mention', name: match[1], id: match[2] });
    lastIdx = match.index + match[0].length;
  }
  if (lastIdx < text.length) parts.push({ type: 'text', content: text.slice(lastIdx) });
  if (!parts.length) return <span className="whitespace-pre-wrap">{text}</span>;
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((p, i) => p.type === 'mention'
        ? <span key={i} className="inline-flex items-center text-primary font-medium bg-primary/10 px-1 rounded text-[11px]">@{p.name}</span>
        : <span key={i}>{p.content}</span>
      )}
    </span>
  );
}
export default CommentText;
