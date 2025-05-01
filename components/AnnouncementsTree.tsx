// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';
import { timeAgo } from '../utils/timeAgo';

// Tipi dati
export type Region = { id: number; name: string };
export type Province = { id: number; name: string };
export type Post = {
  id: number;
  content: string;
  author: string;
  created_at: string;
  province_id: number;
  type: 'cerco' | 'offro';
  nickname?: string;  // 🔵 aggiunto qui
  email?: string;     // 🔵 aggiunto qui
  closed?: boolean;
};

export type CommentWithAuthor = {
  id: number;
  post_id: number;    // 🔵 aggiungiamo post_id che vediamo nei dati veri
  content: string;
  created_at: string;
  author: string;     // 🔵 aggiungiamo anche author
  nickname?: string;  // 🔵 nickname ora è diretto
};

export type Reply = {
  id: number;
  comment_id: number;
  content: string;
  author: string;
  nickname?: string;
  created_at: string;
};


export default function AnnouncementsTree() {
  const { data: regions, error: regionsError } = useSWR<Region[]>(
    '/api/regions',
    fetcher
  );
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  if (regionsError) return <div>Errore caricamento regioni.</div>;
  if (!regions) return <div>Caricamento regioni...</div>;

  const regionName = regions.find((r) => r.id === selectedRegion)?.name || '';

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button
          className="hover:underline"
          onClick={() => {
            setSelectedRegion(null);
            setSelectedProvince(null);
          }}
        >
          Italia
        </button>
        {selectedRegion !== null && (
          <>
            <span>&gt;</span>
            <button
              className="hover:underline"
              onClick={() => setSelectedProvince(null)}
            >
              {regionName}
            </button>
          </>
        )}
        {selectedProvince !== null && (
          <>
            <span>&gt;</span>
            <ProvinceCrumb
              regionId={selectedRegion!}
              provinceId={selectedProvince}
            />
          </>
        )}
      </nav>

      {/* Vista dinamica */}
      {!selectedRegion ? (
        <RegionList
          regions={regions}
          selected={selectedRegion}
          onSelect={setSelectedRegion}
        />
      ) : selectedProvince === null ? (
        <ProvinceList
          regionId={selectedRegion}
          selected={selectedProvince}
          onSelect={setSelectedProvince}
        />
      ) : (
        <PostList provinceId={selectedProvince!} />
      )}
    </div>
  );
}

function RegionList({
  regions,
  selected,
  onSelect,
}: {
  regions: Region[];
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  return (
    <ul className="space-y-2">
      {regions.map((region) => (
        <li key={region.id}>
          <button
            className={`${selected === region.id ? 'text-blue-600' : 'font-semibold'}`}
            onClick={() => onSelect(region.id)}
          >
            {region.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProvinceList({
  regionId,
  selected,
  onSelect,
}: {
  regionId: number;
  selected: number | null;
  onSelect: (id: number) => void;
}) {
  const { data: provinces, error } = useSWR<Province[]>(
    `/api/regions/${regionId}/provinces`,
    fetcher
  );
  if (error) return <div>Errore caricamento province.</div>;
  if (!provinces) return <div>Caricamento province...</div>;

  return (
    <ul className="pl-4 space-y-1 italic">
      {provinces.map((p) => (
        <li key={p.id}>
          <button
            className={`${selected === p.id ? 'text-blue-600' : ''}`}
            onClick={() => onSelect(p.id)}
          >
            {p.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProvinceCrumb({
  regionId,
  provinceId,
}: {
  regionId: number;
  provinceId: number;
}) {
  const { data: provinces } = useSWR<Province[]>(
    `/api/regions/${regionId}/provinces`,
    fetcher
  );
  const prov = provinces?.find((p) => p.id === provinceId);
  return prov ? (
    <span className="font-semibold text-blue-600">{prov.name}</span>
  ) : null;
}

function PostList({ provinceId }: { provinceId: number }) {
  const key = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts, error } = useSWR<Post[]>(key, fetcher);
  const { data: session } = useSWR('user', () => supabase.auth.getUser());
  const userId = session?.data?.user?.id;
  console.log('POSTS:', posts);
  const [creatingType, setCreatingType] = useState<'cerco' | 'offro' | null>(null);
  const [newText, setNewText] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const [commenting, setCommenting] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const clickTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

  const handleClick = (postId: number) => {
    const post = posts?.find(p => p.id === postId);
    if (post?.closed) return;

    if (clickTimers.current[postId]) {
      clearTimeout(clickTimers.current[postId]);
      delete clickTimers.current[postId];
      setCommenting(postId);
    } else {
      clickTimers.current[postId] = setTimeout(() => {
        setExpanded(prev =>
          prev.includes(postId)
            ? prev.filter(x => x !== postId)
            : [...prev, postId]
        );
        delete clickTimers.current[postId];
      }, 300);
    }
  };

  useEffect(() => {
    if (creatingType && inputRef.current) inputRef.current.focus();
  }, [creatingType]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Errore sessione Supabase:', error);
      } else {
        console.log('UTENTE LOGGATO:', user);
      }
    };
    checkSession();
  }, []);

  const createPost = async () => {
    if (!newText.trim() || !creatingType) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      province_id: provinceId,
      content: newText,
      author: user.id,
      type: creatingType,
    });
    if (error) console.error('Errore creazione post:', error);
    else {
      setNewText('');
      setCreatingType(null);
      mutate(key);
    }
  };

  const createComment = async (postId: number, content: string) => {
    if (!content.trim()) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ content }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('Errore creazione commento:', msg);
      } else {
        setCommenting(null);
        mutate(`/api/posts/${postId}/comments?limit=5`);
      }
    } catch (err) {
      console.error('Errore network commento:', err);
    }
  };

  const handleClosePost = async (postId: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        console.error('Nessun token disponibile: utente non loggato.');
        return;
      }
      const res = await fetch(`/api/posts/${postId}/close`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const msg = await res.text();
        console.error('Errore barratura post:', msg);
      } else {
        mutate(key);
      }
    } catch (err) {
      console.error('Errore network barratura:', err);
    }
  };

  const getColor = (type: string) => (type === 'cerco' ? 'text-orange-500' : 'text-green-700');

  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post...</div>;

  return (
    <ul className="pl-8 space-y-2">
      <li className="space-x-4">
        <button className="text-green-700 hover:underline text-sm" onClick={() => setCreatingType('offro')}>+ OFFRO</button>
        <button className="text-orange-500 hover:underline text-sm" onClick={() => setCreatingType('cerco')}>+ CERCO</button>
      </li>
      {creatingType && (
        <li>
          <input
            ref={inputRef}
            className="w-full p-1 border rounded"
            placeholder={`Scrivi un nuovo annuncio "${creatingType.toUpperCase()}"`}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') createPost();
              if (e.key === 'Escape') {
                setCreatingType(null);
                setNewText('');
              }
            }}
            onBlur={() => setCreatingType(null)}
          />
        </li>
      )}
      {posts.map((post) => (
        <li key={post.id}>
          <div
            className={`${getColor(post.type)} ${post.closed ? 'opacity-50' : 'cursor-pointer'}`}
            onClick={() => !post.closed && handleClick(post.id)}
          >
            {post.type === 'offro' ? 'OFFRO: ' : 'CERCO: '}
            <span className="text-black">
              {post.closed ? <s>{post.content}</s> : post.content}
            </span>
            <small className="ml-2 text-gray-500">
              [{post.nickname ?? post.email}, {timeAgo(post.created_at)}]
            </small>
            {!post.closed && userId === post.author && (
              <button
                className="ml-2 text-red-500 text-xs hover:underline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClosePost(post.id);
                }}
              >
                Barra
              </button>
            )}
          </div>

          {expanded.includes(post.id) && (
            <CommentList
              postId={post.id}
              postAuthorId={post.author}
              colorClass="text-black"
              postClosed={post.closed ?? false}
            />
          )}

          {!post.closed && commenting === post.id && (
            <NewCommentInput
              postId={post.id}
              onSubmit={createComment}
              onCancel={() => setCommenting(null)}
            />
          )}
        </li>
      ))}
      {posts.length === 0 && !creatingType && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}


function CommentList({
  postId,
  postAuthorId,
  colorClass,
  postClosed,
}: {
  postId: number;
  postAuthorId: string;
  colorClass: string;
  postClosed: boolean;
}) {
  const { data: comments, error } = useSWR<CommentWithAuthor[]>(
    `/api/posts/${postId}/comments`,
    fetcher
  );
  const commentIds = comments?.map(c => c.id).join(',');
  const { data: replies } = useSWR<Reply[]>(
    comments ? `/api/comments/replies?commentIds=${comments.map(c => c.id).join(',')}` : null,
    fetcher
  );
  console.log('COMMENTS:', comments);
  const { data: session } = useSWR('user', () => supabase.auth.getUser());
  const userId = session?.data?.user?.id;

  const [replying, setReplying] = useState<number | null>(null);
  const [replyText, setReplyText] = useState('');

  const submitReply = async (commentId: number) => {
    if (!replyText.trim()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        console.error('Nessun token disponibile: utente non loggato.');
        return;
      }

      const res = await fetch(`/api/comments/${commentId}/replies`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ content: replyText }),
      });

      if (!res.ok) {
        const msg = await res.text();
        console.error('Errore salvataggio risposta:', msg);
      } else {
        setReplying(null);
        setReplyText('');
        mutate(`/api/posts/${postId}/comments`);
        if (commentIds) {
          mutate(`/api/comments/replies?commentIds=${commentIds}`);
        }
      }
    } catch (err) {
      console.error('Errore network risposta:', err);
    }
  };

  if (error) return <div>Errore caricamento commenti.</div>;
  if (!comments) return <div>Caricamento commenti...</div>;

  return (
    <ul className="pl-12 space-y-1">
      {comments.map((c) => (
        <li key={c.id} className="flex flex-col">
          <div className="flex items-center">
            <span className={`text-sm ${colorClass}`}>
              {postClosed ? <s>{c.content}</s> : c.content}
            </span>
            <small className="ml-2 text-gray-500">
              [{c.nickname}, {timeAgo(c.created_at)}]
            </small>

            {userId === postAuthorId &&
              !postClosed &&
              !replies?.some((r: Reply) => r.comment_id === c.id) && (
                <button
                  className="ml-2 text-blue-500 text-xs"
                  onClick={() => setReplying(c.id)}
                >
                  Rispondi
                </button>
              )}
          </div>

          {!postClosed && replying === c.id && (
            <input
              className="ml-14 mt-1 w-full p-1 border rounded text-sm"
              placeholder="Scrivi una risposta..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitReply(c.id);
                if (e.key === 'Escape') {
                  setReplyText('');
                  setReplying(null);
                }
              }}
              autoFocus
            />
          )}

          {replies &&
            replies
              .filter((r: any) => r.comment_id === c.id)
              .map((r: any) => (
                <div key={r.id} className="ml-20 mt-1 text-sm text-gray-700">
                  {postClosed ? <s>{r.content}</s> : r.content}
                  <small className="ml-2 text-gray-500">
                    [{r.nickname}, {timeAgo(r.created_at)}]
                  </small>
                </div>
              ))}
        </li>
      ))}
    </ul>
  );
}


function NewCommentInput({ postId, onSubmit, onCancel }: { postId: number; onSubmit: (postId: number, content: string) => void; onCancel: () => void }) {
  const [text, setText] = useState('');

  return (
    <div className="pl-12">
      <input
        className="w-full p-1 border rounded"
        placeholder="Scrivi un commento..."
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            onSubmit(postId, text);
            setText('');
          }
          if (e.key === 'Escape') {
            setText('');
            onCancel();
          }
        }}
        onBlur={() => {
          setText('');
          onCancel();
        }}
      />
    </div>
  );
}

