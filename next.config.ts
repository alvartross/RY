import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // HTML 페이지: 항상 최신 버전을 가져오도록 캐시 비활성
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
      {
        // 해시 포함 정적 자산(JS/CSS/폰트 등)은 길게 캐시 — 파일명이 바뀌면 자동으로 갱신됨
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
