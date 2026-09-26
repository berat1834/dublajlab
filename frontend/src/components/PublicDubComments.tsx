import { useEffect, useState } from 'react'
import { getPublicDubComments, addPublicDubComment, deletePublicDubComment, type CommentResponse } from '../lib/api'
import { MessageSquare, Trash2, X } from 'lucide-react'

interface PublicDubCommentsProps {
  projectId: string
  onToast: (msg: string) => void
  onClose: () => void
}

export function PublicDubComments({ projectId, onToast, onClose }: PublicDubCommentsProps) {
  const [comments, setComments] = useState<CommentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const isLoggedIn = !!localStorage.getItem('token')

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const data = await getPublicDubComments(projectId)
        setComments(data)
      } catch {
        onToast('Yorumlar yüklenirken hata oluştu.')
      } finally {
        setLoading(false)
      }
    }
    fetchComments()
  }, [projectId, onToast])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return
    
    setSubmitting(true)
    try {
      const added = await addPublicDubComment(projectId, newComment)
      setComments([...comments, added])
      setNewComment('')
      onToast('Yorumunuz eklendi.')
    } catch {
      onToast('Yorum eklenemedi (1-500 karakter olmalı).')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    if (!window.confirm('Yorumunuzu silmek istiyor musunuz?')) return
    
    try {
      await deletePublicDubComment(projectId, commentId)
      setComments(comments.filter(c => c.id !== commentId))
      onToast('Yorum silindi.')
    } catch {
      onToast('Yorum silinemedi.')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-lime-400" />
            Yorumlar
          </h3>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center text-zinc-500 py-4">Yükleniyor...</div>
          ) : comments.length === 0 ? (
            <div className="text-center text-zinc-500 py-8 text-sm">İlk yorumu sen yaz!</div>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-zinc-800/50 rounded-lg p-3 relative group">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-white text-sm">{c.display_name}</span>
                  <span className="text-[10px] text-zinc-500">{new Date(c.created_at).toLocaleDateString('tr-TR')}</span>
                </div>
                <p className="text-sm text-zinc-300 break-words whitespace-pre-wrap">{c.body}</p>
                
                {c.is_mine && (
                  <button 
                    onClick={() => handleDelete(c.id)}
                    className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition"
                    title="Sil"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="p-4 border-t border-white/10 bg-zinc-950/50">
          {isLoggedIn ? (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                placeholder="Yorumunuz (Max 500 karakter)"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                maxLength={500}
                className="flex-1 bg-zinc-800 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-lime-500/50"
              />
              <button 
                type="submit" 
                disabled={submitting || !newComment.trim()}
                className="bg-lime-400 text-lime-950 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-lime-300 transition"
              >
                Gönder
              </button>
            </form>
          ) : (
            <div className="text-center py-2 text-sm text-zinc-400">
              Yorum yazmak için <a href="/auth" className="text-lime-400 hover:underline">giriş yapın</a>.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
