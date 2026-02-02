'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, MessageCircle, Settings as SettingsIcon, Wallet as WalletIcon, LayoutDashboard, Search } from 'lucide-react';

interface SidebarProps {
  onTextChatOpen?: () => void;
  onSettingsOpen?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ onTextChatOpen, onSettingsOpen }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const hasDrawers = typeof onTextChatOpen === 'function' && typeof onSettingsOpen === 'function';
  const pathname = usePathname();
  const router = useRouter();

  // Keep mobile nav only on small viewports
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const update = () => setIsMobile(window.innerWidth < 1024);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col border-r transition-all duration-300 flex-shrink-0 pt-4 ${
          isExpanded ? 'w-72' : 'w-16'
        }`}
        style={{ 
          borderColor: 'var(--border-opacity-10)',
          backgroundColor: 'var(--bg-secondary)',
          zIndex: 'var(--z-sidebar)'
        }}
      >
        {/* Header */}
        <div 
          className="p-4 border-b flex items-center justify-between"
          style={{ borderColor: 'var(--border-opacity-5)' }}
        >
          {isExpanded && (
            <h1 
              className="text-xl font-normal"
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)'
              }}
            >
              Likable AI
            </h1>
          )}
          <button
            onClick={() => {
              setIsExpanded(!isExpanded);
            }}
            className="p-2 rounded transition-colors"
            style={{ 
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Nav Items */}
        <div className="flex-1 py-4 overflow-y-auto">
          <nav className={`space-y-3 px-3 ${!hasDrawers ? 'pt-3' : ''}`}>
            {hasDrawers && (
              <>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onTextChatOpen!();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                    !isExpanded && 'justify-center'
                  }`}
                  style={{ 
                    fontFamily: "'Times New Roman', Times, serif",
                    color: 'var(--text)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Text Chat"
                >
                  <MessageCircle className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && <span className="text-sm">Text Chat</span>}
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onSettingsOpen!();
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left cursor-pointer ${
                    !isExpanded && 'justify-center'
                  }`}
                  style={{ 
                    fontFamily: "'Times New Roman', Times, serif",
                    color: 'var(--text)',
                    backgroundColor: 'transparent'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  aria-label="Settings"
                >
                  <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                  {isExpanded && <span className="text-sm">Settings</span>}
                </button>
              </>
            )}
            <Link
              href="/dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left no-underline cursor-pointer ${
                !isExpanded && 'justify-center'
              }`}
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Dashboard"
            >
              <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm">Dashboard</span>}
            </Link>
            {/* Extra spacer so Dashboard / Explorer have the same breathing room as Text Chat / Settings */}
            <div className="h-3" />
            <Link
              href="/explorer"
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors text-left no-underline cursor-pointer ${
                !isExpanded && 'justify-center'
              }`}
              style={{ 
                fontFamily: "'Times New Roman', Times, serif",
                color: 'var(--text)',
                backgroundColor: 'transparent'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              aria-label="Explorer"
            >
              <Search className="w-5 h-5 flex-shrink-0" />
              {isExpanded && <span className="text-sm">Explorer</span>}
            </Link>
          </nav>
        </div>

        {/* Footer */}
        <div 
          className="border-t p-4"
          style={{ borderColor: 'var(--border-opacity-5)' }}
        >
          {!isExpanded && (
            <div className="w-full flex justify-center">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: 'var(--bg-opacity-5)' }}
              >
                <WalletIcon 
                  className="w-4 h-4" 
                  style={{ color: 'var(--text-opacity-50)' }}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      {isMobile && (
      <nav 
        data-mobile-bottom-nav="true"
        className="fixed bottom-0 left-0 right-0 safe-area-bottom"
        style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderTop: '1px solid var(--border-opacity-10)',
          zIndex: 'var(--z-sidebar)'
        }}
      >
        <div className="flex items-center justify-around px-4 py-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onTextChatOpen === 'function') {
                onTextChatOpen();
              } else {
                router.push('/?drawer=chat');
              }
            }}
            className="flex flex-col items-center gap-1 p-2 cursor-pointer transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Text Chat"
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">Chat</span>
          </button>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (typeof onSettingsOpen === 'function') {
                onSettingsOpen();
              } else {
                router.push('/?drawer=settings');
              }
            }}
            className="flex flex-col items-center gap-1 p-2 cursor-pointer transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Settings"
          >
            <SettingsIcon className="w-6 h-6" />
            <span className="text-xs">Settings</span>
          </button>
          <Link
            href="/dashboard"
            className="flex flex-col items-center gap-1 p-2 no-underline transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Dashboard"
          >
            <LayoutDashboard className="w-6 h-6" />
            <span className="text-xs">Dashboard</span>
          </Link>
          <Link
            href="/explorer"
            className="flex flex-col items-center gap-1 p-2 no-underline transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Explorer"
          >
            <Search className="w-6 h-6" />
            <span className="text-xs">Explorer</span>
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const walletButton = document.querySelector('[data-wallet-button]') as HTMLElement;

              if (walletButton) walletButton.click();
            }}
            className="flex flex-col items-center gap-1 p-2 cursor-pointer transition-colors"
            style={{ 
              fontFamily: "'Times New Roman', Times, serif",
              color: 'var(--text)',
              backgroundColor: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            aria-label="Wallet"
          >
            <WalletIcon className="w-5 h-5" />
            <span className="text-xs">Wallet</span>
          </button>
        </div>
      </nav>
      )}
    </>
  );
};
