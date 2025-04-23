// components/AnnouncementsTree.tsx
import React, { useState, useEffect, useRef } from 'react';
import useSWR, { mutate } from 'swr';
import { fetcher } from '../lib/fetcher';

// Tipi dati
type Region = { id: number; name: string };
type Province = { id: number; name: string };
type Post = { id: number; title: string; author: { id: string; nickname: string }; created_at: string; isDeleted: boolean };
type Comment = { id: number; content: string; author: { id: string; nickname: string }; created_at: string };

export default function AnnouncementsTree() {
  const { data: regions, error: regionsError } = useSWR<Region[]>('/api/regions', fetcher);
  const [selectedRegion, setSelectedRegion] = useState<number | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<number | null>(null);

  if (regionsError) return <div>Errore nel caricamento delle regioni.</div>;
  if (!regions) return <div>Caricamento delle regioni...</div>;

  const regionName = regions.find(r => r.id === selectedRegion)?.name;

  return (
    <div>
      <nav className="text-lg text-blue-600 mb-4 flex items-center gap-2">
        <button
          className="font-semibold hover:underline"
          onClick={() => { setSelectedRegion(null); setSelectedProvince(null); }}
        >
          Italia
        </button>
        {regionName && (
          <>  <span>&gt;</span>
            <button
              className="font-semibold hover:underline"
              onClick={() => setSelectedProvince(null)}
            >
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
        {regions
          .filter(r => (selectedRegion ? r.id === selectedRegion : true))
          .map(region => (
            <div key={region.id}>
              <button
                className={`font-semibold ${selectedRegion === region.id ? 'text-blue-600' : ''}`}
                onClick={() => { setSelectedRegion(region.id); setSelectedProvince(null); }}
              >
                {region.name}
              </button>

              {selectedRegion === region.id && (
                <ProvinceList
                  provinceIdSelected={selectedProvince}
                  onSelectProvince={id => setSelectedProvince(id)}
                  provincesEndpoint={`/api/regions/${region.id}/provinces`}
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
    <> <span>&gt;</span>
      <button className="font-semibold hover:underline text-blue-600" onClick={onClick}>
        {name}
      </button>
    </>
  );
}

function ProvinceList({
  provincesEndpoint,
  provinceIdSelected,
  onSelectProvince,
}: {
  provincesEndpoint: string;
  provinceIdSelected: number | null;
  onSelectProvince: (id: number) => void;
}) {
  const { data: provinces, error } = useSWR<Province[]>(provincesEndpoint, fetcher);
  if (error) return <div>Errore nel caricamento delle province.</div>;
  if (!provinces) return <div>Caricamento delle province...</div>;

  return (
    <ul role="group" className="pl-4 space-y-1">
      {provinces
        .filter(p => (provinceIdSelected ? p.id === provinceIdSelected : true))
        .map(province => (
          <li key={province.id}>
            <button
              className={`italic ${provinceIdSelected === province.id ? 'text-blue-600' : ''}`}
              onClick={() => onSelectProvince(province.id)}
            >
              {province.name}
            </button>

            {provinceIdSelected === province.id && (
              <PostList provinceId={province.id} />
            )}
          </li>
      ))}
    </ul>
  );
}

function PostList({ provinceId }: { provinceId: number }) {
  const postsKey = `/api/provinces/${provinceId}/posts?limit=5`;
  const { data: posts, error } = useSWR<Post[]>(postsKey, fetcher);
  const [isCreating, setCreating] = useState(false);
  const [newText, setNewText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isCreating) inputRef.current?.focus();
  }, [isCreating]);

  const createPost = async () => {
    if (!newText.trim()) return;
    await fetch(postsKey.replace('?limit=5','') /* endpoint dynamic */, {
      method: 'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ title: newText }),
    });
    setNewText(''); setCreating(false);
    mutate(postsKey);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') { e.preventDefault(); createPost(); }
    if (e.key === 'Escape') { setCreating(false); setNewText(''); }
  };

  if (error) return <div>Errore nel caricamento dei post.</div>;
  if (!posts) return <div>Caricamento dei post...</div>;

  return (
    <ul role="group" className="pl-8 space-y-1">
      <li>
        {isCreating ? (
          <input
            ref={inputRef} type="text" className="w-full p-1 border rounded" placeholder="Nuovo annuncio..."
            value={newText} onChange={e=>setNewText(e.target.value)} onKeyDown={onKeyDown} onBlur={()=>setCreating(false)}
          />
        ) : (
          <button className="text-green-600 hover:underline text-sm" onClick={()=>setCreating(true)}>
            + Scrivi un annuncio
          </button>
        )}
      </li>

      {posts.map(post => (
        <li key={post.id} className={`${post.isDeleted?'opacity-50':''}`}> 
          <span
            className={`${post.isDeleted?'line-through pointer-events-none underline':'cursor-pointer underline'}`}
            onClick={()=>{/* open comments */}}
          >{post.title} <small>[{post.author.nickname}] [{new Date(post.created_at).toLocaleDateString()}]</small></span>
        </li>
      ))}

      {posts.length===0 && !isCreating && (
        <li className="italic text-gray-500">Ancora nessun annuncio</li>
      )}
    </ul>
  );
}

function CommentList({ postId, postAuthorId }: { postId: number; postAuthorId: string }) {
  const { data: comments, error } = useSWR<Comment[]>(`/api/posts/${postId}/comments?limit=5`, fetcher);
  const { data: session } = useSWR<{ user:{id:string} }>('/api/auth/session',fetcher);
  const userId = session?.user?.id;

  if (error) return <div>Errore nel caricamento dei commenti.</div>;
  if (!comments) return <div>Caricamento dei commenti...</div>;

  return (
    <ul role="group" className="pl-12 space-y-1">
      {comments.map(c=> (
        <li key={c.id} className="flex items-center">
          <span className="text-sm">{c.content}</span>
          <small className="ml-2">[{c.author.nickname}] [{new Date(c.created_at).toLocaleDateString()}]</small>
          {userId===postAuthorId && <button className="ml-2 text-blue-500 text-xs" onClick={()=>{/* reply */}}>Rispondi</button>}
        </li>
      ))}
    </ul>
  );
}

/* helper stubs */
function openPostThread(id:number){console.log('thread',id);}
function openUserMessage(id:string){console.log('msg',id);}
function replyToComment(pid:number,cid:number){console.log('reply',cid,'on',pid);}
