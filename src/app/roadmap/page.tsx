'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { Map } from 'lucide-react';

const QUARTERS = [
  { id: 'q1', title: 'Q1', items: ['Launch v1.0', '$LIKA listed, Dev assets locked', 'Meme Studio: images, GIFs, videos', 'Meme websites & hosting'] },
  { id: 'q2', title: 'Q2', items: ['AI meme system & UI refresh', 'Community: profiles, likes, voting', 'Leaderboards & bounty model', 'Invitation & referral system'] },
  { id: 'q3', title: 'Q3', items: ['Meme games & rewards', 'On-chain meme NFT / tokenization', 'Bots: X, TG, TK, IG, FB', 'Multi-chain (Solana → BNB, Base, ETH)'] },
  { id: 'q4', title: 'Q4', items: ['$LIKA on major CEX', 'Rebrand, Web2 + Web3', 'Likable AI App (EU, Android, iOS, web)'] },
];

const DEFLATIONARY = [
  { pct: '50%', label: 'Burned (until 100M $LIKA)' },
  { pct: '25%', label: 'Platform & servers' },
  { pct: '15%', label: 'Community & listing' },
  { pct: '10%', label: 'Team' },
];

const PROGRESS: { date: string; text: string }[] = [
  { date: 'Feb 14', text: 'Roadmap update & recent updates.' },
  { date: 'Feb 12', text: '$LIKA token officially launched.' },
  { date: 'Feb 6', text: 'Meme Studio added.' },
  { date: 'Feb 4', text: '$LIKA confirmed as official currency.' },
  { date: 'Feb 1', text: 'v1.0 launched.' },
  { date: 'Jan', text: 'Project launched; Pumpfun Hackathon.' },
];

export default function RoadmapPage() {
  return (
    <AppLayout>
      <div className="container-padding mx-auto" style={{ maxWidth: 'var(--content-max-width)' }}>
        <header className="text-center section-spacing">
          <div className="flex justify-center mb-3" style={{ color: 'var(--accent)' }}>
            <Map style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)' }} />
          </div>
          <h1 className="page-title mb-2 tracking-tight">
            Roadmap
          </h1>
          <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--text-opacity-70)' }}>
            Likable AI: memecoin services, AI meme lab, voice, memes, NFTs, transactions.
          </p>
        </header>

        <section className="section-spacing">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ gap: 'var(--space-4)' }}>
            {QUARTERS.map((q) => (
              <div key={q.id} className="card" style={{ padding: 'var(--space-3)' }}>
                <h3 className="font-semibold mb-2 text-accent text-sm">{q.title}</h3>
                <ul className="list-disc list-inside text-sm" style={{ color: 'var(--text-opacity-85)', gap: 'var(--space-1)' }}>
                  {q.items.map((bullet, j) => (
                    <li key={j}>{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="section-spacing">
          <h2 className="section-title mb-3 text-sm">$LIKA allocation</h2>
          <div className="card grid gap-3 grid-cols-2 sm:grid-cols-4" style={{ padding: 'var(--space-3)' }}>
            {DEFLATIONARY.map((row, i) => (
              <div key={i} className="text-center p-2 rounded-lg" style={{ backgroundColor: 'var(--bg-opacity-5)' }}>
                <p className="font-bold text-accent">{row.pct}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-opacity-80)' }}>{row.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="section-spacing">
          <h2 className="section-title mb-3 text-sm">Recent</h2>
          <ul className="flex flex-col text-sm" style={{ gap: 'var(--space-2)' }}>
            {PROGRESS.map((p, i) => (
              <li key={i} className="flex gap-3" style={{ color: 'var(--text-opacity-90)' }}>
                <span className="flex-shrink-0 font-medium text-accent" style={{ minWidth: '3.5rem' }}>{p.date}</span>
                {p.text}
              </li>
            ))}
          </ul>
        </section>

        <footer className="text-center section-spacing">
          <Link href="/" className="text-muted text-sm transition-colors hover:text-primary">
            Back to voice companion
          </Link>
        </footer>
      </div>
    </AppLayout>
  );
}
