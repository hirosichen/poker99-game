import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: '撲克牌99遊戲',
  description: '一個有趣的卡牌遊戲，目標是第一個出完手中所有卡牌的玩家獲勝。',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-tw">
      <body className={inter.className}>{children}</body>
    </html>
  );
}