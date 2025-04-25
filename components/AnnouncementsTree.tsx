// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';

// Tipi dati
export type Region = { id: number; name: string };
export type Province = { id: number; name: string };
export type Post = { id: number; content: string; author: string; created_at: string; province_id: number };
export type Comment = { id: number; content: string; author: string; created_at: string };

export default function AnnouncementsTree() {
  const { data: regions, error: regionsError } = useSWR<Region[]>('/api/regions', fetcher);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  if (regionsError) return <div>Errore caricamento regioni.</div>;
  if (!regions) return <div>Caricamento regioni...</div>;

  const regionName = regions.find(r => r.id === selectedRegion)?.name || '';

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button className="hover:underline" onClick={() => { setSelectedRegion(null); setSelectedProvince(null); }}>
          Italia
        </button>
        {selectedRegion !== null && (
          <>
            <span>&gt;</span>
            <button className="hover:underline" onClick={() => setSelectedProvince(null)}>
              {regionName}
            </button>
          </>
        )}
        {selectedProvince !== null && (
          <>
            <span>&gt;</span>
            <ProvinceCrumb regionId={selectedRegion!} provinceId={selectedProvince} />
          </>
        )}
      </nav>

      {/* Vista dinamica */}
      {!selectedRegion ? (
        <RegionList regions={regions} selected={selectedRegion} onSelect={setSelectedRegion} />
      ) : selectedProvince === null ? (
        <ProvinceList regionId={selectedRegion} selected={selectedProvince} onSelect={setSelectedProvince} />
      ) : (
        <PostList provinceId={selectedProvince!} />
      )}
    </div>
  );
}

function RegionList({ regions, selected, onSelect }: { regions: Region[]; selected: number | null; onSelect: (id: number) => void }) {
  return (
    <ul className="space-y-2">
      {regions.map(region => (
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

function ProvinceList({ regionId, selected, onSelect }: { regionId: number; selected: number | null; onSelect: (id: number) => void }) {
  const { data: provinces, error } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  if (error) return <div>Errore caricamento province.</div>;
  if (!provinces) return <div>Caricamento province...</div>;

  return (
    <ul className="pl-4 space-y-1 italic">
      {provinces.map(p => (
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

function ProvinceCrumb({ regionId, provinceId }: { regionId: number; provinceId: number }) {
  const { data: provinces } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  const prov = provinces?.find(p => p.id === provinceId);
  return prov ? <span className="font-semibold text-blue-600">{prov.name}</span> : null;
}

function PostList({ provinceId }: { provinceId: number }) {
  const key = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts, error } = useSWR<Post[]>(key, fetcher);
  const [creatingType, setCreatingType] = useState<'cerco' | 'offro' | null>(null);
  const [newText, setNewText] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (creatingType && inputRef.current) inputRef.current.focus();
  }, [creatingType]);

  const createPost = async () => {
    if (!newText.trim() || !creatingType) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      province_id: provinceId,
      content: newText,
      author: user.id,
      type: creatingType
    });
    if (error) console.error('Errore creazione post:', error);
    else { 
      setNewText('');
      setCreatingType(null);
      mutate(key); 
    }
  };

  const getColor = (type: string) => (type === 'cerco' ? 'text-orange-500' : 'text-blue-500');

  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post...</div>;

  return (
    <ul className="pl-8 space-y-2">
      <li className="space-x-4">
        <button className="text-blue-600 hover:underline text-sm" onClick={() => setCreatingType('offro')}>
          + OFFRO (blu)
        </button>
        <button className="text-orange-500 hover:underline text-sm" onClick={() => setCreatingType('cerco')}>
          + CERCO (arancione)
        </button>
      </li>
      {creatingType && (
        <li>
          <input
            ref={inputRef}
            className="w-full p-1 border rounded"
            placeholder={`Scrivi un nuovo annuncio "${creatingType.toUpperCase()}"`}
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { 
              if (e.key === 'Enter') createPost(); 
              if (e.key === 'Escape') { setCreatingType(null); setNewText(''); } 
            }}
            onBlur={() => setCreatingType(null)}
          />
        </li>
      )}
      {posts.map(post => (
        <li key={post.id}>
          <div
            className={`${getColor(post.type)} underline cursor-pointer`}
            onDoubleClick={() => setExpanded(exp => exp.includes(post.id) ? exp.filter(x => x !== post.id) : [...exp, post.id])}
          >
            {post.type === 'offro' ? 'OFFRO: ' : 'CERCO: '}
            {post.content} 
            <small> [{post.profiles.nickname || post.profiles.email}]</small>
          </div>
          {expanded.includes(post.id) && <CommentList postId={post.id} postAuthorId={post.author} colorClass={getColor(post.type)} />}
        </li>
      ))}
      {posts.length === 0 && !creatingType && <li className="italic text-gray-500">Ancora nessun annuncio</li>}
    </ul>
  );
}

function CommentList({ postId, postAuthorId, colorClass }: { postId: number; postAuthorId: string; colorClass: string }) {
  const { data: comments, error } = useSWR<Comment[]>(`/api/posts/${postId}/comments?limit=5`, fetcher);
  const { data: { user } = {} } = useSWR(() => supabase.auth.getUser(), fetcher);
  const userId = user?.id;

  if (error) return <div>Errore caricamento commenti.</div>;
  if (!comments || comments.length === 0) return <div className="pl-12 italic text-sm text-gray-500">Nessun commento</div>;

  return (
    <ul className="pl-12 space-y-1">
      {comments.map(c => (
        <li key={c.id} className="flex items-center">
          <span className={`text-sm ${colorClass}`}>{c.content}</span>
          <small className="ml-2">[{c.author}]</small>
          {userId === postAuthorId && <button className="ml-2 text-blue-500 text-xs">Rispondi</button>}
        </li>
      ))}
    </ul>
  );
}

