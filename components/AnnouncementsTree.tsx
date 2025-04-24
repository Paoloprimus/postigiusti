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
  const [creating, setCreating] = useState(false);
  const [text, setText]         = useState('');
  const [expanded, setExpanded] = useState<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 1) focus box scrittura
  useEffect(()=>{ if(creating) inputRef.current?.focus() }, [creating]);

  if (error) return <div>Errore caricamento post</div>;
  if (!posts) return <div>Caricamento post…</div>;

  // 2) toggle comment thread
  const toggle = (id:number) => {
    setExpanded(x => x.includes(id) ? x.filter(a=>a!==id) : [...x,id]);
  };

  // 3) crea post
  const createPost = async () => {
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase
      .from('posts')
      .insert({ province_id: provinceId, content: text, author: user.id });
    if (error) console.error(error);
    else {
      setText(''); setCreating(false); mutate(key);
    }
  };

  return (
    <ul className="pl-8 space-y-2">
      <li>
        {creating
          ? <input
              ref={inputRef}
              className="w-full p-1 border rounded"
              placeholder="Scrivi un annuncio…"
              value={text} onChange={e=>setText(e.target.value)}
              onKeyDown={e=> {
                if(e.key==='Enter') createPost();
                if(e.key==='Escape') { setCreating(false); setText(''); }
              }}
              onBlur={()=>setCreating(false)}
            />
          : <button className="text-green-600 hover:underline text-sm" onClick={()=>setCreating(true)}>
              + Scrivi un annuncio
            </button>
        }
      </li>

      {posts.map(p=>(
        <li key={p.id}>
          <div onClick={()=>toggle(p.id)} className="underline cursor-pointer">
            {p.content}
            <small className="ml-2">[{p.author}]</small>
          </div>
          {expanded.includes(p.id) && <CommentList postId={p.id} postAuthorId={p.author} />}
        </li>
      ))}

      {posts.length===0 && !creating && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}

function CommentList({ postId, postAuthorId }: { postId:number; postAuthorId:string }) {
  const { data: comments, error } = useSWR<Comment[]>(`/api/posts/${postId}/comments?limit=5`, fetcher);
  const { data: { user } = {} } = useSWR(() => supabase.auth.getUser(), fetcher);
  const me = user?.id;

  if (error) return <div>Errore caricamento commenti</div>;
  if (!comments) return <div>Caricamento commenti…</div>;

  return (
    <ul className="pl-12 space-y-1">
      {comments.map(c=>(
        <li key={c.id} className="flex items-center">
          <span className="text-sm">{c.content}</span>
          <small className="ml-2">[{c.author}]</small>
          {me===postAuthorId && (
            <button className="ml-2 text-blue-500 text-xs">Rispondi</button>
          )}
        </li>
      ))}
    </ul>
  );
}
