// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';

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
  profiles: { nickname?: string; email: string };
};
export type Comment = {
  id: number;
  content: string;
  author: string;
  created_at: string;
};
export type CommentWithAuthor = {
  id: number;
  content: string;
  created_at: string;
  profiles: {
    nickname?: string;
    email?: string;
  };
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
  const [creatingType, setCreatingType] = useState<'cerco' | 'offro' | null>(
    null
  );
  const [newText, setNewText] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const [commenting, setCommenting] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

const clickTimers = useRef<{ [key: number]: NodeJS.Timeout }>({});

const handleClick = (postId: number) => {
  if (clickTimers.current[postId]) {
    // Secondo click veloce = doppio click
    clearTimeout(clickTimers.current[postId]);
    delete clickTimers.current[postId];
    setCommenting(postId);         // apre input commento
  } else {
    // Primo click
    clickTimers.current[postId] = setTimeout(() => {
      setExpanded(prev => 
        prev.includes(postId) ? prev.filter(x => x !== postId) : [...prev, postId]
      );                           // apre o chiude commenti
      delete clickTimers.current[postId];
    }, 300); // 300ms di attesa
  }
};
  
  useEffect(() => {
    if (creatingType && inputRef.current) inputRef.current.focus();
  }, [creatingType]);

  const createPost = async () => {
    if (!newText.trim() || !creatingType) return;
    const {
      data: { user },
    } = await supabase.auth.getUser();
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

// ——— AGGIORNATO: usa l’endpoint API e passa il JWT dell’utente
const createComment = async (postId: number, content: string) => {
  if (!content.trim()) return;

  try {
    // recupera il token dell’utente loggato
    const {
      data: { session },
    } = await supabase.auth.getSession();
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
      // ricarica la lista commenti di quel post
      mutate(`/api/posts/${postId}/comments?limit=5`);
    }
  } catch (err) {
    console.error('Errore network commento:', err);
  }
};
// ————————————————————————————————————————————————————————————————


  const getColor = (type: string) =>
    type === 'cerco' ? 'text-orange-500' : 'text-blue-500';

  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post...</div>;

  return (
    <ul className="pl-8 space-y-2">
      <li className="space-x-4">
        <button
          className="text-blue-600 hover:underline text-sm"
          onClick={() => setCreatingType('offro')}
        >
          + OFFRO
        </button>
        <button
          className="text-orange-500 hover:underline text-sm"
          onClick={() => setCreatingType('cerco')}
        >
          + CERCO
        </button>
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
            className={`${getColor(post.type)} underline cursor-pointer`}
            onClick={() => setExpanded(prev => prev.includes(post.id) ? prev.filter(x => x !== post.id) : [...prev, post.id])}
            onDoubleClick={() => setCommenting(post.id)}
          >

            {post.type === 'offro' ? 'OFFRO: ' : 'CERCO: '}
            <span className="text-black">{post.content}</span>
            <small className="text-gray-500 ml-2">
              [{post.profiles?.nickname ?? post.profiles?.email ?? post.author}]
            </small>
          </div>
          {expanded.includes(post.id) && (
            <CommentList
              postId={post.id}
              postAuthorId={post.author}
              colorClass="text-black"
            />
          )}
          {commenting === post.id && (
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
}: {
  postId: number;
  postAuthorId: string;
  colorClass: string;
}) {
  const { data: comments, error } = useSWR<CommentWithAuthor[]>(
    `/api/posts/${postId}/comments`,
    fetcher
  );
  // lettura user corrente
  const { data: session } = useSWR('user', () => supabase.auth.getUser());
  const userId = session?.data?.user?.id;

  if (error) return <div>Errore caricamento commenti.</div>;
  if (!comments) return <div>Caricamento commenti...</div>;

  console.log('COMMENTS:', comments);  // ⬅️ AGGIUNGI QUESTO
  
  return (
    <ul className="pl-12 space-y-1">
      {comments.map((c) => (
        <li key={c.id} className="flex items-center">
          <span className={`text-sm ${colorClass}`}>{c.content}</span>
          <small className="ml-2 text-gray-500">
            [{c.profiles?.nickname ?? c.profiles?.email ?? c.author}]
          </small>
          {userId === postAuthorId && (
            <button className="ml-2 text-blue-500 text-xs">Rispondi</button>
          )}
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

