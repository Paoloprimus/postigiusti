// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';

type Region = { id: number; name: string };
type Province = { id: number; name: string };
type Post = { id: number; content: string; author: string; created_at: string; province_id: number };

type Profile = { id: string; nickname: string };

type Comment = { id: number; content: string; author: string; created_at: string };

export default function AnnouncementsTree() {
  const { data: regions } = useSWR<Region[]>('/api/regions', fetcher);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  if (!regions) return <div>Caricamento regioni...</div>;

  const regionName = regions.find(r => r.id === selectedRegion)?.name;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button className="hover:underline" onClick={() => { setSelectedRegion(null); setSelectedProvince(null); }}>
          Italia
        </button>
        {selectedRegion != null && (
          <>
            <span>&gt;</span>
            <button className="hover:underline" onClick={() => setSelectedProvince(null)}>
              {regionName}
            </button>
          </>
        )}
        {selectedProvince != null && (
          <>
            <span>&gt;</span>
            <ProvinceCrumb regionId={selectedRegion!} provinceId={selectedProvince} />
          </>
        )}
      </nav>

      {/* Content */}
      {!selectedRegion ? (
        <RegionList regions={regions} onSelect={setSelectedRegion} selected={selectedRegion} />
      ) : !selectedProvince ? (
        <ProvinceList regionId={selectedRegion} onSelect={setSelectedProvince} selected={selectedProvince} />
      ) : (
        <PostList provinceId={selectedProvince} />
      )}
    </div>
  );
}

function RegionList({ regions, onSelect, selected }: { regions: Region[]; onSelect: (id: number) => void; selected: number | null }) {
  return (
    <ul className="space-y-2">
      {regions.map(r => (
        <li key={r.id}>
          <button
            className={`${selected === r.id ? 'text-blue-600' : 'font-semibold'}`}
            onClick={() => onSelect(r.id)}
          >
            {r.name}
          </button>
        </li>
      ))}
    </ul>
  );
}

function ProvinceList({ regionId, onSelect, selected }: { regionId: number; onSelect: (id: number) => void; selected: number | null }) {
  const { data: provinces } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  if (!provinces) return <div>Caricamento province...</div>;
  return (
    <ul className="pl-4 space-y-1 italic">
      {provinces.map(p => (
        <li key={p.id}>
          <button className={`${selected === p.id ? 'text-blue-600' : ''}`} onClick={() => onSelect(p.id)}>
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
  const [isCreating, setIsCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isCreating) inputRef.current?.focus(); }, [isCreating]);
  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post...</div>;

  const toggle = (id: number) => {
    setExpanded(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createPost = async () => {
    if (!newText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from('posts').insert({ province_id: provinceId, content: newText, author: user.id });
    if (error) console.error(error);
    else { setNewText(''); setIsCreating(false); mutate(key); }
  };

  return (
    <ul className="pl-8 space-y-1">
      <li>
        {isCreating ? (
          <input
            ref={inputRef}
            className="w-full p-1 border rounded"
            placeholder="Scrivi un nuovo annuncio…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => { if (e.key==='Enter') createPost(); if (e.key==='Escape') { setIsCreating(false); setNewText(''); } }}
            onBlur={() => setIsCreating(false)}
          />
        ) : (
          <button className="text-green-600 hover:underline text-sm" onClick={() => setIsCreating(true)}>
            + Scrivi un annuncio
          </button>
        )}
      </li>

      {posts.map(post => (
        <li key={post.id} className="space-y-1">
          <div onClick={() => toggle(post.id)} className="underline cursor-pointer">
            {post.content}
          </div>
          {expanded.includes(post.id) && (
            <CommentList postId={post.id} postAuthorId={post.author} />
          )}
        </li>
      ))}
      {posts.length === 0 && !isCreating && <li className="italic text-gray-500">Ancora nessun annuncio</li>}
    </ul>
  );
}

function CommentList({ postId, postAuthorId }: { postId: number; postAuthorId: string }) {
  const { data: comments, error } = useSWR<Comment[]>(`/api/posts/${postId}/comments?limit=5`, fetcher);
  const { data: { user } = {} } = useSWR(() => supabase.auth.getUser(), fetcher);
  const userId = user?.id;

  if (error) return <div>Errore caricamento commenti.</div>;
  if (!comments) return <div>Caricamento commenti...</div>;

  return (
    <ul className="pl-12 space-y-1">
      {comments.map(c => (
        <li key={c.id} className="flex items-center">
          <span className="text-sm">{c.content}</span>
          <small className="ml-2">[{c.author}]</small>
          {userId === postAuthorId && <button className="ml-2 text-blue-500 text-xs">Rispondi</button>}
        </li>
      ))}
    </ul>
  );
}
