// components/AnnouncementsTree.tsx
import { useState } from 'react';
import useSWR from 'swr';
import { fetcher } from '../lib/fetcher';

type Region = { id: number; name: string };
type Province = { id: number; name: string };
type Post = {
  id: number;
  title: string;
  author: { id: string; nickname: string };
  created_at: string;
  isDeleted: boolean;
};
type Comment = {
  id: number;
  content: string;
  author: { id: string; nickname: string };
  created_at: string;
};

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
          onClick={() => {
            setSelectedRegion(null);
            setSelectedProvince(null);
          }}
        >
          Italia
        </button>
        {regionName && (
          <>
            <span>&gt;</span>
            <button
              className="font-semibold hover:underline"
              onClick={() => {
                setSelectedProvince(null);
              }}
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
                onClick={() => {
                  setSelectedRegion(region.id);
                  setSelectedProvince(null);
                }}
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

function ProvinceCrumb({
  regionId,
  provinceId,
  onClick,
}: {
  regionId: number;
  provinceId: number;
  onClick: () => void;
}) {
  const { data: provinces } = useSWR<Province[]>(
    `/api/regions/${regionId}/provinces`,
    fetcher
  );
  const name = provinces?.find(p => p.id === provinceId)?.name;

  if (!name) return null;
  return (
    <>
      <span>&gt;</span>
      <button className="font-semibold hover:underline" onClick={onClick}>
        {name}
      </button>
    </>
  );
}

function ProvinceList({
  regionId,
  selectedProvince,
  onSelectProvince,
}: {
  regionId: number;
  selectedProvince: number | null;
  onSelectProvince: (id: number) => void;
}) {
  const { data: provinces, error } = useSWR<Province[]>(
    `/api/regions/${regionId}/provinces`,
    fetcher
  );
  if (error) return <div>Errore nel caricamento delle province.</div>;
  if (!provinces) return <div>Caricamento delle province...</div>;

  return (
    <ul role="group" className="pl-4 space-y-1">
      {provinces
        .filter(p => (selectedProvince ? p.id === selectedProvince : true))
        .map(province => (
          <li key={province.id}>
            <button
              className={`italic ${selectedProvince === province.id ? 'text-blue-600' : ''}`}
              onClick={() => onSelectProvince(province.id)}
            >
              {province.name}
            </button>

            {selectedProvince === province.id && <PostList provinceId={province.id} />}
          </li>
        ))}
    </ul>
  );
}

function PostList({ provinceId }: { provinceId: number }) {
  const { data: posts, error } = useSWR<Post[]>(
    `/api/provinces/${provinceId}/posts?limit=5`,
    fetcher
  );
  if (error) return <div>Errore nel caricamento dei post.</div>;
  if (!posts) return <div>Caricamento dei post...</div>;

  return (
    <ul role="group" className="pl-8 space-y-1">
      {posts.map(post => (
        <li key={post.id} className={`${post.isDeleted ? 'opacity-50' : ''}`}> 
          <span
            className={`cursor-pointer ${post.isDeleted ? 'line-through pointer-events-none' : 'underline'}`}
            onClick={() => openPostThread(post.id)}
          >
            {post.title}{' '}
            <small>
              [{post.author.nickname}]{' '}
              [{new Date(post.created_at).toLocaleDateString()}]
            </small>
          </span>
          <span
            className="cursor-pointer text-sm underline ml-2"
            onClick={() => openUserMessage(post.author.id)}
          >
            {post.author.nickname}
          </span>
          <CommentList postId={post.id} postAuthorId={post.author.id} />
        </li>
      ))}
    </ul>
  );
}

function CommentList({ postId, postAuthorId }: { postId: number; postAuthorId: string }) {
  const { data: comments, error } = useSWR<Comment[]>(
    `/api/posts/${postId}/comments?limit=5`,
    fetcher
  );
  const { data: session } = useSWR<{ user: { id: string } }>('/api/auth/session', fetcher);
  const userId = session?.user?.id;
  if (error) return <div>Errore nel caricamento dei commenti.</div>;
  if (!comments) return <div>Caricamento dei commenti...</div>;

  return (
    <ul role="group" className="pl-12 space-y-1">
      {comments.map(comment => (
        <li key={comment.id} className="flex items-center">
          <span className="text-sm">{comment.content}</span>
          <small className="ml-2">
            [{comment.author.nickname}]{' '}
            [{new Date(comment.created_at).toLocaleDateString()}]
          </small>
          {userId === postAuthorId && (
            <button
              className="ml-2 text-blue-500 text-xs"
              onClick={() => replyToComment(postId, comment.id)}
            >
              Rispondi
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* Helper functions */
function openPostThread(postId: number) { console.log('Open thread for post', postId); }
function openUserMessage(userId: string) { console.log('Open message to user', userId); }
function replyToComment(postId: number, commentId: number) { console.log('Reply to comment', commentId, 'on post', postId); }
