'use client';

import React, { ReactNode } from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  onTextChatOpen?: () => void;
  onSettingsOpen?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ 
  children, 
  onTextChatOpen, 
  onSettingsOpen 
}) => {
  return (
    <div 
      className="flex min-h-screen h-dvh w-full overflow-x-hidden transition-colors duration-200"
      style={{ backgroundColor: "var(--bg)", color: "var(--text)" }}
    >
      <Sidebar 
        onTextChatOpen={onTextChatOpen}
        onSettingsOpen={onSettingsOpen}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto relative">
        {children}
      </main>
    </div>
  );
};