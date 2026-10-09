import { useState, useEffect, useCallback, useRef } from 'react';
import { apiFetch } from '@material/api/http';
import BoardSDK from '@material/api/BoardSDK.js';

const MENTION_RE = /@\[([^\]]+)\]\(([^)]+)\)/g;
const board = new BoardSDK();

export function useComments(itemId) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const commentsRef = useRef([]);

  useEffect(() => {
    board.users.me().execute().then(setCurrentUser).catch(console.error);
  }, []);

  const fetchComments = useCallback(async () => {
    if (!itemId) return;
    try {
      const rows = await apiFetch(`/api/items/${encodeURIComponent(itemId)}/comments`);
      const next = Array.isArray(rows) ? rows : [];
      commentsRef.current = next;
      setComments(next);
    } catch (err) {
      console.error('[Comments] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);
  useEffect(() => {
    if (!itemId) return undefined;
    const interval = setInterval(fetchComments, 90000);
    return () => clearInterval(interval);
  }, [itemId, fetchComments]);

  const notifyMentions = useCallback(async (text) => {
    const regex = new RegExp(MENTION_RE.source, 'g');
    let match;
    while ((match = regex.exec(text)) !== null) {
      const userId = match[2];
      if (userId === currentUser?.id) continue;
      try {
        await board.item(itemId).notify(userId)
          .create(`${currentUser?.name || 'Someone'} mentioned you in a comment`).execute();
      } catch (err) { console.error('[Comments] Notify failed:', err); }
    }
  }, [itemId, currentUser]);

  const addComment = useCallback(async (text) => {
    if (!text.trim() || !currentUser) return;
    try {
      const saved = await apiFetch(`/api/items/${encodeURIComponent(itemId)}/comments`, {
        method: 'POST', body: JSON.stringify({ text: text.trim() }),
      });
      commentsRef.current = [...commentsRef.current, saved];
      setComments(commentsRef.current);
      notifyMentions(text);
    } catch (err) {
      console.error('[Comments] Add failed:', err);
      return { error: true };
    }
  }, [itemId, currentUser, notifyMentions]);

  const editComment = useCallback(async (id, newText) => {
    try {
      const original = commentsRef.current.find((c) => c.id === id);
      const saved = await apiFetch(`/api/comments/${encodeURIComponent(id)}`, {
        method: 'PATCH', body: JSON.stringify({ text: newText.trim() }),
      });
      commentsRef.current = commentsRef.current.map((c) => c.id === id ? saved : c);
      setComments(commentsRef.current);
      if (original) {
        const oldMentions = new Set();
        const oldRegex = new RegExp(MENTION_RE.source, 'g');
        let m;
        while ((m = oldRegex.exec(original.text)) !== null) oldMentions.add(m[2]);
        const newMentionText = newText.replace(new RegExp(MENTION_RE.source, 'g'), (full, name, uid) => oldMentions.has(uid) ? '' : full);
        if (newMentionText.includes('@[')) notifyMentions(newMentionText);
      }
    } catch (err) {
      console.error('[Comments] Edit failed:', err);
      return { error: true };
    }
  }, [notifyMentions]);

  const deleteComment = useCallback(async (id) => {
    try {
      await apiFetch(`/api/comments/${encodeURIComponent(id)}`, { method: 'DELETE' });
      commentsRef.current = commentsRef.current.filter((c) => c.id !== id);
      setComments(commentsRef.current);
    } catch (err) {
      console.error('[Comments] Delete failed:', err);
      return { error: true };
    }
  }, []);

  return { comments, loading, currentUser, addComment, editComment, deleteComment };
}
