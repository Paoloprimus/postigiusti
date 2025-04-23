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

  const regionName = regions.find(r => r.id === selectedRegion)?.name;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Bacheca</h1>
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button className="font-semibold hover:underline" onClick={() => { setSelectedRegion(null); setSelectedProvince(null); }}>
          Italia
        </button>
        {regionName && (
          <>
            <span>&gt;</span>
            <button className="font-semibold hover:underline" onClick={() => setSelectedProvince(null)}>
              {regionName}
            </button>
          </>
        )}
        {selectedProvince && (
          <ProvinceCrumb
            regionId={selectedRegion!}
            provinceId={selectedProvince}
            onClick={() => setSelectedProvince(null)}
          />
        )}
      </nav>

      <div role="tree" className="space-y-2">
        {regions.filter(r => selectedRegion ? r.id === selectedRegion : true).map(region => (
          <div key={region.id}>
            <button
              className={`font-semibold ${selectedRegion === region.id ? 'text-blue-600' : ''}`}
              onClick={() => { setSelectedRegion(region.id); setSelectedProvince(null); }}
            >
              {region.name}
            </button>

            {selectedRegion === region.id && (
              <ProvinceList
                regionId={region.id}
                selectedProvince={selectedProvince}
                onSelectProvince={id => setSelectedProvince(id)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProvinceCrumb({ regionId, provinceId, onClick }: { regionId: number; provinceId: number; onClick: () => void }) {
  const { data: provinces } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  const name = provinces?.find(p => p.id === provinceId)?.name;
  if (!name) return null;
  return (
    <>
      <span>&gt;</span>
      <button className="font-semibold hover:underline text-blue-600" onClick={onClick}>
        {name}
      </button>
    </>
  );
}

function ProvinceList({ regionId, selectedProvince, onSelectProvince }: { regionId: number; selectedProvince: number | null; onSelectProvince: (id: number) => void }) {
  const { data: provinces, error } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  if (error) return <div>Errore nel caricamento delle province.</div>;
  if (!provinces) return <div>Caricamento delle province...</div>;

  return (
    <ul role="group" className="pl-4 space-y-1">
      {provinces.map(province => (
        <li key={province.id}>
          <button
            className={`italic ${selectedProvince === province.id ? 'text-blue-600' : ''}`}
            onClick={() => onSelectProvince(province.id)}
          >
            {province.name}
          </button>

          {selectedProvince === province.id && (
            <PostList provinceId={province.id} />
          )}
        </li>
      ))}
    </ul>
  );
}

function PostList({ provinceId }: { provinceId: number }) {
  const key = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts = [], error } = useSWR<Post[]>(key, fetcher);
  const [isCreating, setCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (isCreating) inputRef.current?.focus(); }, [isCreating]);
  if (error) return <div>Errore nel caricamento dei post.</div>;
  if (!posts) return <div>Caricamento dei post...</div>;

  const createPost = async () => {
    if (!newText.trim()) return;
    const { data, error } = await supabase
      .from('posts')
      .insert({ province_id: provinceId, content: newText, author: (await supabase.auth.getSession()).data.session!.user.id })
      .select('id,content,author,created_at,province_id');
    if (error) console.error('Errore creazione post', error);
    else {
      setNewText(''); setCreating(false);
      mutate(key);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); createPost(); }
    if (e.key === 'Escape') { setCreating(false); setNewText(''); }
  };

  return (
    <ul role="group" className="pl-8 space-y-1">
      <li>
        {isCreating ? (
          <input
            ref={inputRef}
            type="text"
            className="w-full p-1 border rounded"
            placeholder="Scrivi un nuovo annuncio…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setCreating(false)}
          />
        ) : (
          <button className="text-green-600 hover:underline text-sm" onClick={() => setCreating(true)}>
            + Scrivi un annuncio
          </button>
        )}
      </li>

      {posts.map(post => (
        <li key={post.id} className={`${post.isDeleted ? 'opacity-50' : ''}`}> 
          <span
            className={`${post.isDeleted ? 'line-through pointer-events-none' : 'underline cursor-pointer'}`}
            onClick={() => console.log('Open thread', post.id)}
          >
            {post.content} <small>[{post.author}] [{new Date(post.created_at).toLocaleDateString()}]</small>
          </span>
        </li>
      ))}

      {posts.length === 0 && !isCreating && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}
