// pages/index.tsx

export function getServerSideProps() {
  return {
    redirect: {
      destination: '/login',
      permanent: false,
    },
  };
}

export default function Home() {
  return null;
}
