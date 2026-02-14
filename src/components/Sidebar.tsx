'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, Home, MessageCircle, Settings as SettingsIcon, Wallet as WalletIcon, LayoutDashboard, Search, ImageIcon, Twitter, Github, Map, MoreVertical } from 'lucide-react';

/* Single sidebar layout tokens - one spacing value for all gaps/padding */
const SIDEBAR_SPACING = 'var(--space-3)';

const SIDEBAR_ASIDE_STYLE = {
  borderColor: 'var(--border-opacity-10)',
  backgroundColor: 'var(--bg-secondary)',
  zIndex: 'var(--z-sidebar)',
  paddingTop: SIDEBAR_SPACING,
} as const;

const SIDEBAR_HEADER_STYLE = {
  padding: SIDEBAR_SPACING,
  borderColor: 'var(--border-opacity-5)',
} as const;

const SIDEBAR_NAV_CONTAINER_STYLE = {
  padding: `${SIDEBAR_SPACING} 0`,
} as const;

const SIDEBAR_NAV_STYLE = {
  gap: SIDEBAR_SPACING,
  paddingLeft: SIDEBAR_SPACING,
  paddingRight: SIDEBAR_SPACING,
} as const;

const SIDEBAR_ITEM_STYLE = {
  gap: SIDEBAR_SPACING,
  padding: SIDEBAR_SPACING,
} as const;

const SIDEBAR_ITEM_CLASS = 'nav-link w-full flex items-center rounded-lg text-left cursor-pointer';

const SIDEBAR_FOOTER_STYLE = {
  borderColor: 'var(--border-opacity-5)',
  padding: SIDEBAR_SPACING,
} as const;

const ICON_LG = { width: 'var(--icon-lg)', height: 'var(--icon-lg)' } as const;
const ICON_XL = { width: 'var(--icon-xl)', height: 'var(--icon-xl)' } as const;

interface SidebarProps {
  onTextChatOpen?: () => void;
  onSettingsOpen?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTextChatOpen, onSettingsOpen }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  /* Single sidebar: Home first, then Chat, Settings, Dashboard, Explorer. From Dashboard/Explorer, Chat/Settings navigate to home with drawer param. */
  type NavItem = {
    id: string;
    label: string;
    ariaLabel: string;
    icon: React.ReactNode;
    href?: string;
    onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  };
  const desktopNavItems: NavItem[] = [
    {
      id: 'home',
      label: 'Home',
      ariaLabel: 'Home',
      icon: <Home className="flex-shrink-0" style={ICON_LG} />,
      href: '/',
    },
    {
      id: 'chat',
      label: 'Text Chat',
      ariaLabel: 'Text Chat',
      icon: <MessageCircle className="flex-shrink-0" style={ICON_LG} />,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof onTextChatOpen === 'function') onTextChatOpen();
        else router.push('/?drawer=chat');
      },
    },
    {
      id: 'settings',
      label: 'Settings',
      ariaLabel: 'Settings',
      icon: <SettingsIcon className="flex-shrink-0" style={ICON_LG} />,
      onClick: (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof onSettingsOpen === 'function') onSettingsOpen();
        else router.push('/?drawer=settings');
      },
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      ariaLabel: 'Dashboard',
      icon: <LayoutDashboard className="flex-shrink-0" style={ICON_LG} />,
      href: '/dashboard',
    },
    {
      id: 'explorer',
      label: 'Explorer',
      ariaLabel: 'Explorer',
      icon: <Search className="flex-shrink-0" style={ICON_LG} />,
      href: '/explorer',
    },
    {
      id: 'meme-studio',
      label: 'Meme Studio',
      ariaLabel: 'Meme Studio',
      icon: <ImageIcon className="flex-shrink-0" style={ICON_LG} />,
      href: '/meme-studio',
    },
    {
      id: 'roadmap',
      label: 'Roadmap',
      ariaLabel: 'Roadmap',
      icon: <Map className="flex-shrink-0" style={ICON_LG} />,
      href: '/roadmap',
    },
  ];

  return (
    <>
      {/* Desktop Sidebar - one sidebar for all pages */}
      <aside
        className={`hidden lg:flex lg:flex-col border-r transition-all duration-300 flex-shrink-0 ${
          isExpanded ? 'w-sidebar' : 'w-sidebar-collapsed'
        }`}
        style={SIDEBAR_ASIDE_STYLE}
      >
        <div
          className="border-b flex items-center justify-between"
          style={SIDEBAR_HEADER_STYLE}
        >
          {isExpanded && <h1 className="page-title text-xl">Likable AI</h1>}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="nav-link p-2 rounded-lg"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <X style={ICON_LG} /> : <Menu style={ICON_LG} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto" style={SIDEBAR_NAV_CONTAINER_STYLE}>
          <nav className="flex flex-col" style={SIDEBAR_NAV_STYLE}>
            {desktopNavItems.map((item) => {
              const itemClassName = `${SIDEBAR_ITEM_CLASS} ${!isExpanded ? 'justify-center' : ''}`;
              if (item.href) {
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    className={itemClassName}
                    style={SIDEBAR_ITEM_STYLE}
                    aria-label={item.ariaLabel}
                  >
                    {item.icon}
                    {isExpanded && <span className="text-sm">{item.label}</span>}
                  </Link>
                );
              }
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.onClick}
                  className={itemClassName}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label={item.ariaLabel}
                >
                  {item.icon}
                  {isExpanded && <span className="text-sm">{item.label}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t" style={SIDEBAR_FOOTER_STYLE}>
          <div className={`flex w-full ${isExpanded ? 'items-center justify-center gap-2' : 'flex-col items-center gap-1'}`} style={isExpanded ? { gap: SIDEBAR_SPACING } : { gap: 'var(--space-1)' }}>
            <a
              href="https://x.com/LikableAI"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link rounded-lg flex items-center justify-center shrink-0"
              style={{ width: 'var(--space-8)', height: 'var(--space-8)', color: 'var(--text-opacity-70)' }}
              aria-label="Likable AI on X (Twitter)"
            >
              <Twitter style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            </a>
            <a
              href="https://github.com/likableai/LIKABLE-AI"
              target="_blank"
              rel="noopener noreferrer"
              className="nav-link rounded-lg flex items-center justify-center shrink-0"
              style={{ width: 'var(--space-8)', height: 'var(--space-8)', color: 'var(--text-opacity-70)' }}
              aria-label="Likable AI on GitHub"
            >
              <Github style={{ width: 'var(--icon-md)', height: 'var(--icon-md)' }} />
            </a>
          </div>
          {!isExpanded && (
            <div className="w-full flex justify-center mt-2" style={{ marginTop: 'var(--space-2)' }}>
              <div
                className="rounded-lg flex items-center justify-center"
                style={{
                  width: 'var(--space-8)',
                  height: 'var(--space-8)',
                  backgroundColor: 'var(--bg-opacity-5)',
                }}
              >
                <WalletIcon className="flex-shrink-0" style={{ width: 'var(--icon-md)', height: 'var(--icon-md)', color: 'var(--text-opacity-50)' }} />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav - Home, Dashboard, Explorer, Meme + collapsible (Settings, Chats, Roadmap) */}
      {isMobile && (
        <>
          {/* Collapsible panel above the bar */}
          {mobileMenuOpen && (
            <div
              className="fixed left-0 right-0 lg:hidden transition-opacity"
              style={{
                bottom: 'max(5rem, calc(5rem + env(safe-area-inset-bottom)))',
                zIndex: 'calc(var(--z-sidebar) - 1)',
                backgroundColor: 'var(--bg-secondary)',
                borderTop: '1px solid var(--border-opacity-10)',
                borderBottom: '1px solid var(--border-opacity-10)',
                padding: SIDEBAR_SPACING,
                boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
              }}
            >
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onSettingsOpen === 'function') onSettingsOpen();
                    else router.push('/?drawer=settings');
                    setMobileMenuOpen(false);
                  }}
                  className={`nav-link w-full flex items-center rounded-lg text-left cursor-pointer ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Settings"
                >
                  <SettingsIcon className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (typeof onTextChatOpen === 'function') onTextChatOpen();
                    else router.push('/?drawer=chat');
                    setMobileMenuOpen(false);
                  }}
                  className={`nav-link w-full flex items-center rounded-lg text-left cursor-pointer ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Chats"
                >
                  <MessageCircle className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Chats</span>
                </button>
                <Link
                  href="/roadmap"
                  onClick={() => setMobileMenuOpen(false)}
                  className={`nav-link w-full flex items-center rounded-lg no-underline ${SIDEBAR_ITEM_CLASS}`}
                  style={SIDEBAR_ITEM_STYLE}
                  aria-label="Roadmap"
                >
                  <Map className="flex-shrink-0" style={ICON_LG} />
                  <span className="text-sm">Roadmap</span>
                </Link>
              </div>
            </div>
          )}
          <nav
            data-mobile-bottom-nav="true"
            className="fixed bottom-0 left-0 right-0 safe-area-bottom"
            style={{
              ...SIDEBAR_ASIDE_STYLE,
              borderTop: '1px solid var(--border-opacity-10)',
              borderRight: 'none',
            }}
          >
            <div className="flex items-center justify-around" style={{ padding: 'var(--space-3) var(--space-4)' }}>
              <Link href="/" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Home">
                <Home style={ICON_XL} />
                <span className="text-xs">Home</span>
              </Link>
              <Link href="/dashboard" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Dashboard">
                <LayoutDashboard style={ICON_XL} />
                <span className="text-xs">Dashboard</span>
              </Link>
              <Link href="/explorer" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Explorer">
                <Search style={ICON_XL} />
                <span className="text-xs">Explorer</span>
              </Link>
              <Link href="/meme-studio" className="nav-link flex flex-col items-center no-underline rounded-lg p-2" style={{ gap: 'var(--space-1)' }} aria-label="Meme Studio">
                <ImageIcon style={ICON_XL} />
                <span className="text-xs">Meme</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen((open) => !open)}
                className="nav-link flex flex-col items-center cursor-pointer rounded-lg p-2"
                style={{ gap: 'var(--space-1)' }}
                aria-label="More: Settings, Chats, Roadmap"
                aria-expanded={mobileMenuOpen}
              >
                <MoreVertical style={ICON_XL} />
                <span className="text-xs">More</span>
              </button>
            </div>
          </nav>
        </>
      )}
    </>
  );
};
