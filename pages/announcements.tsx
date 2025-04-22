// pages/announcements.tsx
import Layout from '../components/Layout';
import AnnouncementsTree from '../components/AnnouncementsTree';

export default function AnnouncementsPage() {
  return (
    <Layout>
      {/* Titolo subito sotto la Navbar */}
      <h1 className="text-2xl font-bold my-4">Annunci</h1>
      <AnnouncementsTree />
    </Layout>
  );
}


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
  const { data: regions } = useSWR<Region[]>('/api/regions', fetcher);
  const [expandedRegion, setExpandedRegion] = useState<number | null>(null);
  const [expandedProvince, setExpandedProvince] = useState<number | null>(null);

  return (
    <div role="tree" className="space-y-2">
      {regions?.map(region => (
        <div key={region.id}>
          <button
            className="font-semibold"
            onClick={() => setExpandedRegion(prev => (prev === region.id ? null : region.id))}
          >
            {region.name}
          </button>
          {expandedRegion === region.id && (
            <ProvinceList
              regionId={region.id}
              expandedProvince={expandedProvince}
              setExpandedProvince={setExpandedProvince}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function ProvinceList({
  regionId,
  expandedProvince,
  setExpandedProvince,
}: {
  regionId: number;
  expandedProvince: number | null;
  setExpandedProvince: React.Dispatch<React.SetStateAction<number | null>>;
}) {
  const { data: provinces } = useSWR<Province[]>(
    regionId ? `/api/regions/${regionId}/provinces` : null,
    fetcher
  );

  return (
    <div role="group" className="pl-4 space-y-1">
      {provinces?.map(province => (
        <div key={province.id}>
          <button
            className="italic"
            onClick={() => setExpandedProvince(prev => (prev === province.id ? null : province.id))}
          >
            {province.name}
          </button>
          {expandedProvince === province.id && <PostList provinceId={province.id} />}
        </div>
      ))}
    </div>
  );
}

function PostList({ provinceId }: { provinceId: number }) {
  const { data: posts } = useSWR<Post[]>(
    provinceId ? `/api/provinces/${provinceId}/posts?limit=5` : null,
    fetcher
  );

  return (
    <div role="group" className="pl-8 space-y-1">
      {posts?.map(post => (
        <div key={post.id} className={`flex flex-col ${post.isDeleted ? 'opacity-50' : ''}`}> 
          <span
            className={`cursor-pointer ${post.isDeleted ? 'line-through pointer-events-none' : 'underline'}`}
            onClick={() => !post.isDeleted && openPostThread(post.id)}
          >
            {post.title} <small>[{post.author.nickname}] [{new Date(post.created_at).toLocaleDateString()}]</small>
          </span>
          <span
            className="cursor-pointer text-sm underline"
            onClick={() => openUserMessage(post.author.id)}
          >
            {post.author.nickname}
          </span>
          <CommentList postId={post.id} postAuthorId={post.author.id} />
        </div>
      ))}
    </div>
  );
}

function CommentList({
  postId,
  postAuthorId,
}: {
  postId: number;
  postAuthorId: string;
}) {
  const { data: comments } = useSWR<Comment[]>(
    postId ? `/api/posts/${postId}/comments?limit=5` : null,
    fetcher
  );
  const { data: session } = useSWR<{ user: { id: string } }>('/api/auth/session', fetcher);
  const userId = session?.user?.id;

  return (
    <div role="group" className="pl-12 space-y-1">
      {comments?.map(comment => (
        <div key={comment.id} className="flex items-center">
          <span className="text-sm">{comment.content}</span>
          <small className="ml-2">[{comment.author.nickname}] [{new Date(comment.created_at).toLocaleDateString()}]</small>
          {userId === postAuthorId && (
            <button
              className="ml-2 text-blue-500 text-xs"
              onClick={() => replyToComment(postId, comment.id)}
            >
              Rispondi
            </button>
          )}
        </div>
      ))}
    </div>
  );
}

/* Helper functions */
function openPostThread(postId: number) {
  console.log('Open thread for post', postId);
}

function openUserMessage(userId: string) {
  console.log('Open message to user', userId);
}

function replyToComment(postId: number, commentId: number) {
  console.log('Reply to comment', commentId, 'on post', postId);
}
