// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';

// Tipi dati
type Region = { id: number; name: string };
type Province = { id: number; name: string };
type Post = { id: number; content: string; author: string; created_at: string; isDeleted: boolean };
type Comment = { id: number; content: string; author: string; created_at: string };

export default function AnnouncementsTree() {
  const { data: regions, error: regionsError } = useSWR<Region[]>('/api/regions', fetcher);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  if (regionsError) return <div>Errore nel caricamento delle regioni.</div>;
  if (!regions) return <div>Caricamento delle regioni...</div>;

  // Nome per breadcrumb
  const regionName = regions.find(r => r.id === selectedRegion)?.name;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bacheca</h1>

      {/* Breadcrumb */}
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button className="hover:underline" onClick={() => { setSelectedRegion(null); setSelectedProvince(null); }}>
          Italia
        </button>
        {selectedRegion && (
          <>
            <span>&gt;</span>
            <button className="hover:underline" onClick={() => setSelectedProvince(null)}>
              {regionName}
            </button>
          </>
        )}
        {selectedProvince && (
          <>
            <span>&gt;</span>
            <button className="hover:underline" onClick={() => { /* torna a regione */ setSelectedProvince(null); }}>
              {<ProvinceCrumb regionId={selectedRegion!} provinceId={selectedProvince} />}
            </button>
          </>
        )}
      </nav>

      {/* Contenuto: tree o post list */}
      {selectedProvince ? (
        <PostList provinceId={selectedProvince} />
      ) : selectedRegion ? (
        <ProvinceList regionId={selectedRegion} selectedProvince={selectedProvince} onSelectProvince={setSelectedProvince} />
      ) : (
        <RegionList onSelectRegion={id => { setSelectedRegion(id); setSelectedProvince(null); }} selectedRegion={selectedRegion} regions={regions} />
      )}
    </div>
  );
}

// Lista regioni
function RegionList({ regions, selectedRegion, onSelectRegion }: { regions: Region[]; selectedRegion: number | null; onSelectRegion: (id: number) => void }) {
  return (
    <ul className="space-y-2">
      {regions.map(r => (
        <li key={r.id}>
          <button
            className={`font-semibold ${selectedRegion === r.id ? 'text-blue-600' : ''}`}
            onClick={() => onSelectRegion(r.id)}
          >
            {r.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

// Lista province
function ProvinceList({ regionId, selectedProvince, onSelectProvince }: { regionId: number; selectedProvince: number | null; onSelectProvince: (id: number) => void }) {
  const { data: provinces, error } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  if (error) return <div>Errore nel caricamento delle province.</div>;
  if (!provinces) return <div>Caricamento delle province...</div>;

  return (
    <ul className="pl-4 space-y-1 italic">
      {provinces.map(p => (
        <li key={p.id}>
          <button
            className={`${selectedProvince === p.id ? 'text-blue-600' : ''}`}
            onClick={() => onSelectProvince(p.id)}
          >
            {p.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

// Breadcrumb snippet per provincia
function ProvinceCrumb({ regionId, provinceId }: { regionId: number; provinceId: number }) {
  const { data: provinces } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  const name = provinces?.find(p => p.id === provinceId)?.name;
  return <>{name}</>;
}

// Lista post con inline create, nickname e commenti expand
function PostList({ provinceId }: { provinceId: number }) {
  const key = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts = [], error } = useSWR<Post[]>(key, fetcher);
  const [isCreating, setCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [nicknames, setNicknames] = useState<Record<string,string>>({});
  const [expanded, setExpanded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // autofocus input
  useEffect(() => { if (isCreating) inputRef.current?.focus(); }, [isCreating]);

  // fetch nicknames
  useEffect(() => {
    const ids = Array.from(new Set(posts.map(p => p.author)));
    if (!ids.length) return;
    supabase.from('profiles').select('id,nickname').in('id', ids).then(({ data }) => {
      if (data) setNicknames(Object.fromEntries(data.map(d => [d.id, d.nickname])));
    });
  }, [posts]);

  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post...</div>;

  // create
  const createPost = async () => {
    if (!newText.trim()) return;
    const userId = supabase.auth.getUser()?.data.user?.id;
    const { error } = await supabase
      .from('posts')
      .insert({ province_id, content: newText, author: userId })
      .select();
    if (error) console.error(error);
    else {
      setNewText(''); setCreating(false);
      mutate(key);
    }
  };

  // toggle expand comments
  const toggle = (id: number) => setExpanded(expanded.includes(id) ? expanded.filter(x => x !== id) : [...expanded, id]);

  return (
    <ul className="pl-8 space-y-1">
      <li>
        {isCreating ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full p-1 border rounded"
            placeholder="Scrivi un nuovo annuncio…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') createPost(); if (e.key==='Escape') { setCreating(false); setNewText(''); } }}
            onBlur={() => setCreating(false)}
          />
        ) : (
          <button className="text-green-600 hover:underline text-sm" onClick={() => setCreating(true)}>
            + Scrivi un annuncio
          </button>
        )}
      </li>

      {posts.map(post => (
        <li key={post.id} className={`${post.isDeleted?'opacity-50':''}`}> 
          <div onClick={() => toggle(post.id)} className="underline cursor-pointer">
            {post.content} <small>[{nicknames[post.author]||post.author}]</small> [{new Date(post.created_at).toLocaleDateString()}]
          </div>
          {expanded.includes(post.id) && (
            <CommentList postId={post.id} postAuthorId={post.author} />
          )}
        </li>
      ))}

      {posts.length===0 && !isCreating && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}

// CommentList rimane... (omesso per brevità)
function CommentList({ postId, postAuthorId }: { postId: number; postAuthorId: string }) {
  // ... implement inline comment like PostList
  return <div className="pl-12 italic text-gray-500">[Lista commenti qui]</div>;
}
