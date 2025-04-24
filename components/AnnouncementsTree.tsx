import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';
import { supabase } from '../lib/supabase';

type Region   = { id: number; name: string };
type Province = { id: number; name: string };
type Post     = { id: number; content: string; author: string; created_at: string; province_id: number };
type Comment  = { id: number; content: string; author: string; created_at: string };

export default function AnnouncementsTree() {
  const { data: regions, error: regErr } = useSWR<Region[]>('/api/regions', fetcher);
  const [selReg, setSelReg]       = useState<number|null>(null);
  const [selProv, setSelProv]     = useState<number|null>(null);

  if (regErr) return <div>Errore caricamento regioni</div>;
  if (!regions) return <div>Caricamento regioni…</div>;

  const regionName = regions.find(r => r.id === selReg)?.name;

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="text-blue-600 mb-4 flex gap-2">
        <button className="hover:underline" onClick={()=>{setSelReg(null);setSelProv(null);}}>Italia</button>
        {selReg  != null && <>› <button className="hover:underline" onClick={()=> setSelProv(null)}>{regionName}</button></>}
        {selProv != null && <>› <ProvinceCrumb regionId={selReg!} provinceId={selProv} /></>}
      </nav>

      {/* Vista: regioni → province → postList */}
      {!selReg
        ? <RegionList   regions={regions}     selected={selReg}   onSelect={setSelReg} />
        : !selProv
          ? <ProvinceList regionId={selReg}     selected={selProv}  onSelect={setSelProv} />
          : <PostList     provinceId={selProv} />
      }
    </div>
  );
}

function RegionList({ regions, selected, onSelect }: { regions: Region[]; selected: number|null; onSelect: (id:number)=>void }) {
  return (
    <ul className="space-y-2">
      {regions.map(r=>(
        <li key={r.id}>
          <button
            className={selected===r.id ? 'text-blue-600' : 'font-semibold'}
            onClick={()=>onSelect(r.id)}
          >{r.name}</button>
        </li>
      ))}
    </ul>
  );
}

function ProvinceList({ regionId, selected, onSelect }: { regionId:number; selected:number|null; onSelect:(id:number)=>void }) {
  const { data: provinces, error } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  if (error) return <div>Errore caricamento province</div>;
  if (!provinces) return <div>Caricamento province…</div>;

  return (
    <ul className="pl-4 space-y-1 italic">
      {provinces.map(p=>(
        <li key={p.id}>
          <button
            className={selected===p.id ? 'text-blue-600' : ''}
            onClick={()=>onSelect(p.id)}
          >{p.name}</button>
        </li>
      ))}
    </ul>
  );
}

function ProvinceCrumb({ regionId, provinceId }: { regionId:number; provinceId:number }) {
  const { data: provinces } = useSWR<Province[]>(`/api/regions/${regionId}/provinces`, fetcher);
  const name = provinces?.find(p=>p.id===provinceId)?.name;
  return name ? <span className="font-semibold text-blue-600">{name}</span> : null;
}

function PostList({ provinceId }: { provinceId: number }) {
  const key = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts, error } = useSWR<Post[]>(key, fetcher);
  const [nickMap, setNickMap] = useState<Record<string,string>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Appena arrivano i post, prendi tutti i profili degli autori
  useEffect(() => {
    if (!posts || posts.length === 0) return;
    const ids = Array.from(new Set(posts.map(p => p.author)));
    supabase
      .from('profiles')
      .select('id,nickname')
      .in('id', ids)
      .then(({ data, error }) => {
        if (error) {
          console.error('Errore fetch profili:', error);
          return;
        }
        const m: Record<string,string> = {};
        data!.forEach(p => { m[p.id] = p.nickname; });
        setNickMap(m);
      });
  }, [posts]);

  // Focus sull’input quando creo
  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  if (error) return <div>Errore caricamento post.</div>;
  if (!posts) return <div>Caricamento post…</div>;

  const toggle = (id: number) => {
    setExpanded(prev => prev.includes(id)
      ? prev.filter(x => x !== id)
      : [...prev, id]
    );
  };

  const createPost = async () => {
    if (!newText.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('posts')
      .insert({ province_id: provinceId, content: newText, author: user.id });
    if (error) console.error(error);
    else {
      setNewText('');
      setIsCreating(false);
      mutate(key);
    }
  };

  return (
    <ul className="pl-8 space-y-2">
      <li>
        {isCreating ? (
          <input
            ref={inputRef}
            className="w-full p-1 border rounded"
            placeholder="Scrivi un annuncio…"
            value={newText}
            onChange={e => setNewText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') createPost();
              if (e.key === 'Escape') { setIsCreating(false); setNewText(''); }
            }}
            onBlur={() => setIsCreating(false)}
          />
        ) : (
          <button
            className="text-green-600 hover:underline text-sm"
            onClick={() => setIsCreating(true)}
          >
            + Scrivi un annuncio
          </button>
        )}
      </li>

      {posts.map(p => (
        <li key={p.id}>
          <div onClick={() => toggle(p.id)} className="underline cursor-pointer">
            {p.content}{' '}
            <small>[{nickMap[p.author] ?? p.author}]</small>
          </div>
          {expanded.includes(p.id) && (
            <CommentList postId={p.id} postAuthorId={p.author} />
          )}
        </li>
      ))}

      {posts.length === 0 && !isCreating && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}
