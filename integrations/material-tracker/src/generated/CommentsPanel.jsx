import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@material/components/ui/button';
import { Avatar, AvatarFallback } from '@material/components/ui/avatar';
import { Skeleton } from '@material/components/ui/skeleton';
import { Send, Pencil, Trash2, X, Check, Loader2 } from 'lucide-react';
import { useComments } from '@material/generated/hooks/useComments';
import { useBoardUsers } from '@material/generated/hooks/useBoardUsers';
import MentionInput from '@material/generated/MentionInput';
import CommentText from '@material/generated/CommentText';
import { toast } from 'sonner';

const initials = (name) => name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
const fmtTime = (iso) => new Date(iso).toLocaleDateString('en-US', {
  month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
});

export function CommentsPanel({ itemId, canWrite = false }) {
  const { comments, loading, currentUser, addComment, editComment, deleteComment } = useComments(itemId);
  const { users } = useBoardUsers();
  const [newText, setNewText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const endRef = useRef(null);

  // D4: Track previous comment length so scroll only fires on actual new comments,
  // not on edit operations that replace the array without changing length
  const prevLengthRef = useRef(0);
  useEffect(() => {
    if (comments.length > prevLengthRef.current) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevLengthRef.current = comments.length;
  }, [comments.length]);

  const handleAdd = async () => {
    if (!canWrite || !newText.trim()) return;
    setSending(true);
    const result = await addComment(newText);
    if (result?.error) { toast.error('Comment failed to save'); }
    else { setNewText(''); }
    setSending(false);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAdd(); }
  };
  const startEdit = (c) => { setEditingId(c.id); setEditText(c.text); };
  const handleEditSave = async (id) => {
    if (!canWrite || !editText.trim()) return;
    const result = await editComment(id, editText);
    if (result?.error) { toast.error('Edit failed to save'); }
    setEditingId(null);
  };
  const handleEditKey = (e) => {
    if (e.key === 'Escape') setEditingId(null);
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleEditSave(editingId); }
  };
  const handleDel = async (id) => {
    if (!canWrite) return;
    setDeletingId(id);
    const result = await deleteComment(id);
    if (result?.error) { toast.error('Delete failed — restored'); }
    setDeletingId(null);
  };

  if (loading) return <div className="p-4"><Skeleton className="h-16 rounded-lg" /></div>;

  return (
    <div className="px-5 py-4 space-y-3 border-t border-border/60 bg-muted/10">
      <div className="max-h-60 overflow-y-auto space-y-3 pr-1">
        {comments.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-3">No comments yet. Be the first to comment.</p>
        )}
        {comments.map(cmt => (
          <div key={cmt.id} className={`flex gap-2.5 ${deletingId === cmt.id ? 'opacity-50' : ''} transition-opacity`}>
            <Avatar className="size-7 shrink-0">
              <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                {initials(cmt.authorName)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-medium text-foreground">{cmt.authorName}</span>
                <span className="text-[10px] text-muted-foreground">{fmtTime(cmt.createdAt)}</span>
                {cmt.editedAt && <span className="text-[10px] text-muted-foreground italic">(edited)</span>}
              </div>
              {editingId === cmt.id ? (
                <div className="mt-1 space-y-1.5">
                  <MentionInput value={editText} onChange={setEditText} onKeyDown={handleEditKey}
                    className="min-h-[32px] text-xs" users={users} />
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => handleEditSave(cmt.id)}><Check className="size-3" />Save</Button>
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1" onClick={() => setEditingId(null)}><X className="size-3" />Cancel</Button>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-foreground/90 mt-0.5"><CommentText text={cmt.text} /></p>
              )}
            </div>
            {canWrite && currentUser?.id === cmt.authorId && editingId !== cmt.id && (
              <div className="flex gap-0.5 shrink-0 pt-0.5">
                <Button size="icon" variant="ghost" className="size-6" onClick={() => startEdit(cmt)} aria-label="Edit comment">
                  <Pencil className="size-3 text-muted-foreground" />
                </Button>
                <Button size="icon" variant="ghost" className="size-6" onClick={() => handleDel(cmt.id)} aria-label="Delete comment">
                  <Trash2 className="size-3 text-muted-foreground" />
                </Button>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>
      {canWrite ? (
        <div className="flex gap-2 items-end">
          <MentionInput value={newText} onChange={setNewText} onKeyDown={handleKeyDown}
            placeholder="Type @ to mention someone..." className="min-h-[36px] text-xs" users={users} />
          <Button size="icon" className="size-8 shrink-0" onClick={handleAdd}
            disabled={!newText.trim() || sending} aria-label="Send comment">
            {sending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
          </Button>
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">Viewer access is read-only. Comments can be reviewed but not modified.</p>
      )}
    </div>
  );
}
export default CommentsPanel;
