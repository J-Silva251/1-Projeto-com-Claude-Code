"use client";

import { useState, useEffect } from "react";
import type { Comment } from "@/types";

interface CommentsProps {
  articleId: string;
}

const STORAGE_KEY = (id: string) => `gn_comments_${id}`;

export default function Comments({ articleId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [posted, setPosted] = useState(false);

  // Carrega comentários do localStorage ao montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY(articleId));
      if (saved) setComments(JSON.parse(saved));
    } catch { /* localStorage indisponível */ }
  }, [articleId]);

  function saveComments(updated: Comment[]) {
    setComments(updated);
    try { localStorage.setItem(STORAGE_KEY(articleId), JSON.stringify(updated)); } catch { /* */ }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      articleId,
      name: name.trim(),
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    saveComments([newComment, ...comments]);
    setName("");
    setText("");
    setPosted(true);
    setTimeout(() => setPosted(false), 3000);
  }

  function deleteComment(id: string) {
    saveComments(comments.filter((c) => c.id !== id));
  }

  return (
    <section className="mt-10 border-t border-white/10 pt-8">
      <h3 className="text-base font-bold text-white mb-6 font-mono">
        💬 Comentários ({comments.length})
      </h3>

      {/* Formulário de novo comentário */}
      <form onSubmit={handleSubmit} className="glass rounded-xl p-5 mb-8 border border-white/10">
        <div className="flex flex-col sm:flex-row gap-3 mb-3">
          <input
            type="text"
            placeholder="Seu nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={50}
            className="flex-1 bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D4FF]/60"
          />
        </div>
        <textarea
          placeholder="Escreva um comentário..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          maxLength={500}
          className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00D4FF]/60 resize-none mb-3"
        />
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-white/20 font-mono">{text.length}/500</span>
          <button
            type="submit"
            className="px-4 py-1.5 bg-[#00D4FF]/10 border border-[#00D4FF]/40 text-[#00D4FF] text-sm font-mono rounded hover:bg-[#00D4FF]/20 transition-colors"
          >
            {posted ? "✓ Publicado!" : "Publicar"}
          </button>
        </div>
      </form>

      {/* Lista de comentários */}
      {comments.length === 0 ? (
        <p className="text-sm text-white/30 text-center font-mono py-6">
          Seja o primeiro a comentar.
        </p>
      ) : (
        <div className="space-y-4">
          {comments.map((c) => (
            <div key={c.id} className="glass rounded-lg p-4 border border-white/8">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-[#00D4FF]/20 flex items-center justify-center text-xs font-bold text-[#00D4FF]">
                    {c.name[0].toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold text-white">{c.name}</span>
                  <span className="text-[10px] text-white/30 font-mono">
                    {new Date(c.timestamp).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                <button
                  onClick={() => deleteComment(c.id)}
                  className="text-white/20 hover:text-red-400 text-xs transition-colors"
                  title="Remover comentário"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">{c.text}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
