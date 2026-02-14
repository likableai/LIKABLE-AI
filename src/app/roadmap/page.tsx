'use client';

import React from 'react';
import Link from 'next/link';
import { AppLayout } from '@/components/AppLayout';
import { Map } from 'lucide-react';

const INTRO =
  'Likable AI is currently in its early stages of development. We are dedicated to innovating Memecoin services, bringing traditional Memecoin business into an AI agent, and creating an AI meme lab integrating voice, memes, GIFs, videos, websites, NFTs, and transactions through code.';

const DEV_PLAN: { quarter: string; text: string }[] = [
  { quarter: 'Q1', text: 'First, train the AI to understand all the context it knows and update the AI database in real time to understand current trends. Especially when users provide AI smart contracts, the AI should be able to analyze the narrative behind the coin, its name, and its current market capitalization. At the end of the contract, it should ask: "Do you need me to generate memes, GIFs, videos, websites, NFTs, etc. for this project?" (Currently, a hyperlink to Meme Studio is generated; later updates will directly show the AI\'s involvement in these activities.)' },
  { quarter: 'Q1', text: 'Train the AI to know its name is "Likable AI" and mention in the text that our platform is in its early development stage, with the stock code $LIKA. After issuing LIKA tokens, the AI will understand that the LIKA smart contract is deployed by us and provide accurate smart contract information to users, along with a DEX purchase hyperlink. Of course, the AI also needs to be trained to understand its own positioning.' },
  { quarter: 'Q1', text: 'We consider text and voice chat to be free, but generating memes, GIFs, videos, websites, NFTs, and transactions will incur a service fee of $LIKA from the wallet. The AI will also understand that we offer free chat, but some services require $LIKA to achieve advanced features.' },
  { quarter: 'Q1', text: 'Add a project roadmap and latest progress update. The roadmap represents the project\'s future plans, while the latest progress update includes significant milestones and development achievements. These updates help the community actively participate and drive anticipation and user experience.' },
  { quarter: 'Q1', text: 'From initial meme images, GIFs, and videos to website generation, customized website generation and one-stop website hosting services were all handled by AI. Fees for services such as website generation were deducted from platform currency $LIKA.' },
  { quarter: 'Q2', text: 'The AI was upgraded, allowing it to directly generate memes, GIFs, videos, and websites for users through voice and text chat. The Likable AI website UI was completely revamped, moving away from a black-and-white style to a personalized AI application service style similar to other AI applications on the market.' },
  { quarter: 'Q2', text: 'Community features were added, including user profiles, followers, comments, likes, competitions, and voting, enabling community user interaction, activating the project lifecycle, and increasing user stickiness.' },
  { quarter: 'Q2', text: 'Meme image leaderboards, competition leaderboards, and reward leaderboards were added. These visually appealing features help users understand the platform\'s meme leaderboard rules, allowing users to automatically develop competitiveness, thereby increasing the fun and competitiveness of projects, increasing platform revenue, and facilitating future ecosystem expansion.' },
  { quarter: 'Q2', text: 'Develop creator revenue, allowing users to earn money through memes and other works. This asset will be invested through community incentives. The bounty model involves creators completing tasks posted on the platform and uploading them to the community. Creators can receive a fixed reward from the platform through the bounty list. Content that can be posted includes creating invitation videos, reporting platform bugs, etc., thereby incentivizing user loyalty and helping new users, among other benefits.' },
  { quarter: 'Q2', text: 'Develop an invitation mechanism, including a leaderboard for inviters and a leaderboard for invitation rewards. This invitation model will further increase the number of users on the platform, allowing more people to experience the entertainment and uses of memes.' },
  { quarter: 'Q3', text: 'Develop meme games, allowing users to earn rewards through meme games. The games will include fun and challenging level-based games, helping users increase their $LIKA earnings and community sharing. Sharing will attract more users to join the platform for entertainment, thereby expanding the platform\'s user base and achieving explosive growth.' },
  { quarter: 'Q3', text: 'Develop meme charts that support on-chain operations, enabling meme NFT and NFT tokenization. This feature helps artistic creators monetize through memes, similar to OpenSea. Ultimately, we aim to create the world\'s largest comprehensive meme trading market.' },
  { quarter: 'Q3', text: 'Develop bots like X, TG, TK, IG, and FB to interact with users through memes, ensuring activity on social media and maintaining Likable AI\'s visibility, reaching 8 billion people globally from different perspectives.' },
  { quarter: 'Q3', text: 'Develop multiple public chain services, enabling cross-chain liquidity and multi-chain asset services for $LIKA. Strategically, this will initially provide meme services from Solana to other active public chains such as BNB, Base, and ETH. This will enable asset returns across different public chains, essentially cross-chain functionality. With a market capitalization in the tens of millions, $LIKA can support cross-chain operations, allowing the Likable AI brand to expand its crypto presence globally.' },
  { quarter: 'Q4', text: 'Likable AI\'s stock ticker $LIKA will be listed on major exchanges. A portion of the $LIKA assets used for community marketing will be used as listing fees to incentivize the community\'s anticipation for Likable AI\'s future.' },
  { quarter: 'Q4', text: 'Likable AI will undergo a brand upgrade, entering the Web2 market with its Web3 products and becoming the leading meme maker. Once the market reaches a certain stage of development, in addition to earning money from Web3, we can also develop a Web2 model. Users can customize and switch between modes. For Web2, we will adopt a subscription model, allowing Web2 users to subscribe for paid activities. Over time, different types of Web2 gameplay will be updated.' },
  { quarter: 'Q4', text: 'Develop the Likable AI App and launch it in major international markets such as the EU. As we follow the usage habits of Web2 on the web and launch the App based on data, we will make the App available on major app stores such as the EU. Supports Android, iOS, and web versions.' },
];

const QUARTERS = [
  {
    id: 'q1',
    title: 'Likable AI – Q1',
    items: [
      'Project launch and release of initial version 1.0.',
      'The Likable AI platform\'s $LIKA token is listed, and Dev account assets are locked.',
      'Develop Meme Studio, meme images, GIFs, and videos.',
      'Develop meme websites, customized websites, and one-stop hosting websites.',
    ],
  },
  {
    id: 'q2',
    title: 'Likable AI – Q2',
    items: [
      'The AI meme system has been deeply optimized. The UI has been completely updated.',
      'Develop features such as community, comments, likes, competitions, voting, followers, and profiles.',
      'Develop meme design leaderboards, competition leaderboards, and reward leaderboards.',
      'Develop creator revenue through a bounty model.',
      'Develop an invitation mechanism, including a referrer leaderboard and referral reward leaderboard.',
    ],
  },
  {
    id: 'q3',
    title: 'Likable AI – Q3',
    items: [
      'Develop meme games where users can earn rewards.',
      'Develop meme images that support on-chain operations, enabling meme NFT and NFT tokenization.',
      'Develop bots such as X, TG, TK, IG, and FB to interact with users through memes.',
      'Develop multi-chain services, starting with Solana and expanding to other active public chains.',
    ],
  },
  {
    id: 'q4',
    title: 'Likable AI – Q4',
    items: [
      'Likable AI\'s stock code $LIKA will be listed on major CEX.',
      'Likable AI is rebranding, entering the Web2 market with its Web3 products and becoming the leading meme maker.',
      'Develop the Likable AI App and launch it in major international markets such as the EU. Supports Android, iOS, and web versions.',
    ],
  },
];

const DEFLATIONARY = [
  { pct: '50%', label: 'Burned, all tokens until 100,000,000 $LIKA is burned' },
  { pct: '25%', label: 'Platform server maintenance and updates' },
  { pct: '15%', label: 'Community marketing, community incentives, and listing fees' },
  { pct: '10%', label: 'Team salaries, used to hire AI engineers and pay salaries to each member of the team' },
];

const PROGRESS: { date: string; text: string }[] = [
  { date: 'February 6', text: 'Likable AI added a Meme Studio to provide meme services for the crypto community.' },
  { date: 'February 4', text: 'The ticker symbol $LIKA was officially confirmed as the sole official currency for Likable AI.' },
  { date: 'February 1', text: 'Likable AI completed and launched version 1.0, entering the next phase of development.' },
  { date: 'January', text: 'The Likable AI project was launched and participated in the Pumpfun Hackathon.' },
];

export default function RoadmapPage() {
  return (
    <AppLayout>
      <div className="container-padding mx-auto" style={{ maxWidth: 'var(--content-max-width)' }}>
        {/* Hero */}
        <header className="text-center section-spacing">
          <div className="flex justify-center mb-4" style={{ color: 'var(--accent)' }}>
            <Map style={{ width: 'var(--icon-xl)', height: 'var(--icon-xl)' }} />
          </div>
          <h1 className="page-title mb-4 tracking-tight">
            Likable AI <span className="text-accent">Framework</span>
          </h1>
          <p className="page-subtitle text-lg max-w-2xl mx-auto" style={{ color: 'var(--text-opacity-80)' }}>
            {INTRO}
          </p>
        </header>

        {/* Development plan (1–17) */}
        <section className="section-spacing">
          <h2 className="section-title mb-4">Core development plan</h2>
          <ul className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
            {DEV_PLAN.map((item, i) => (
              <li key={i} className="card flex gap-3" style={{ padding: 'var(--space-4)', alignItems: 'flex-start' }}>
                <span
                  className="flex-shrink-0 rounded-lg font-semibold text-sm"
                  style={{
                    padding: 'var(--space-1) var(--space-2)',
                    backgroundColor: 'var(--bg-opacity-10)',
                    color: 'var(--accent)',
                  }}
                >
                  {item.quarter}
                </span>
                <span className="text-sm" style={{ color: 'var(--text-opacity-90)' }}>
                  {item.text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Project roadmap Q1–Q4 */}
        <section className="section-spacing">
          <h2 className="section-title mb-4">Project roadmap</h2>
          <div className="grid gap-6 md:grid-cols-2" style={{ gap: 'var(--space-6)' }}>
            {QUARTERS.map((q) => (
              <div key={q.id} className="card" style={{ padding: 'var(--space-4)' }}>
                <h3 className="font-semibold mb-3 text-accent" style={{ fontSize: 'var(--font-lg)' }}>
                  {q.title}
                </h3>
                <ul className="list-disc list-inside flex flex-col" style={{ gap: 'var(--space-2)', color: 'var(--text-opacity-85)' }}>
                  {q.items.map((bullet, j) => (
                    <li key={j} className="text-sm">{bullet}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Deflationary mechanism */}
        <section className="section-spacing">
          <h2 className="section-title mb-4">$LIKA&apos;s deflationary mechanism</h2>
          <div className="card grid gap-4 sm:grid-cols-2 lg:grid-cols-4" style={{ padding: 'var(--space-4)', gap: 'var(--space-4)' }}>
            {DEFLATIONARY.map((row, i) => (
              <div
                key={i}
                className="rounded-xl p-4 text-center"
                style={{
                  backgroundColor: 'var(--bg-opacity-5)',
                  border: '1px solid var(--border-opacity-10)',
                }}
              >
                <p className="font-bold text-accent" style={{ fontSize: 'var(--font-xl)' }}>{row.pct}</p>
                <p className="text-sm mt-1" style={{ color: 'var(--text-opacity-80)' }}>{row.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Latest progress */}
        <section className="section-spacing">
          <h2 className="section-title mb-4">Latest project progress</h2>
          <div className="card" style={{ padding: 'var(--space-4)' }}>
            <ul className="flex flex-col" style={{ gap: 'var(--space-3)' }}>
              {PROGRESS.map((p, i) => (
                <li key={i} className="flex gap-4 items-start border-b border-opacity-10 pb-3 last:border-0 last:pb-0" style={{ borderColor: 'var(--border-opacity-10)' }}>
                  <span className="flex-shrink-0 font-medium text-accent text-sm" style={{ minWidth: '6rem' }}>{p.date}</span>
                  <span className="text-sm" style={{ color: 'var(--text-opacity-90)' }}>{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
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
