'use client';

import { useState, ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    IconLayoutGrid,
    IconUsers,
    IconSpeakerphone,
    IconChartBar,
    IconSettings,
} from '@tabler/icons-react';

type NavItem = {
    href: string;
    icon: ReactNode;
    label: string;
};

const NAV_ITEMS: NavItem[] = [
    { href: '/pages', icon: <IconLayoutGrid size={20} />, label: 'Pages' },
    { href: '/crm', icon: <IconUsers size={20} />, label: 'CRM' },
    { href: '/campaigns', icon: <IconSpeakerphone size={20} />, label: 'Campaigns' },
    { href: '/analytics', icon: <IconChartBar size={20} />, label: 'Analytics' },
];

type ShellProps = {
    children: ReactNode;
    panel?: ReactNode;
    panelOpen?: boolean;
};

export function Shell({ children, panel, panelOpen = false }: ShellProps) {
    const [navExpanded, setNavExpanded] = useState(false);
    const pathname = usePathname();

    return (
        <div className="shell">
            {/* Left Navigation */}
            <nav
                className="nav"
                onMouseEnter={() => setNavExpanded(true)}
                onMouseLeave={() => setNavExpanded(false)}
                data-expanded={navExpanded}
            >
                <div className="nav-logo">
                    <span className="nav-logo-mark">M</span>
                    {navExpanded && <span className="nav-logo-text">MIKA</span>}
                </div>

                <div className="nav-items">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname.startsWith(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="nav-item"
                                data-active={isActive}
                            >
                                <span className="nav-item-icon">{item.icon}</span>
                                {navExpanded && <span className="nav-item-label">{item.label}</span>}
                            </Link>
                        );
                    })}
                </div>

                <div className="nav-footer">
                    <Link href="/settings" className="nav-item">
                        <span className="nav-item-icon"><IconSettings size={20} /></span>
                        {navExpanded && <span className="nav-item-label">Settings</span>}
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="main">
                {children}
            </main>

            {/* Right Panel (contextual) */}
            {panel && (
                <aside className="panel" data-open={panelOpen}>
                    {panel}
                </aside>
            )}

            <style jsx>{`
        .shell {
          display: flex;
          min-height: 100vh;
          background: var(--bg-primary);
        }
        
        /* Navigation */
        .nav {
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          width: var(--nav-width);
          background: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 100;
          transition: width 0.15s ease;
          overflow: hidden;
        }
        
        .nav[data-expanded="true"] {
          width: var(--nav-width-expanded);
        }
        
        .nav-logo {
          height: 48px;
          display: flex;
          align-items: center;
          padding: 0 14px;
          border-bottom: 1px solid var(--border);
          gap: 10px;
        }
        
        .nav-logo-mark {
          font-family: var(--font-mono);
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
          flex-shrink: 0;
        }
        
        .nav-logo-text {
          font-family: var(--font-mono);
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          letter-spacing: 0.1em;
          white-space: nowrap;
        }
        
        .nav-items {
          flex: 1;
          padding: 8px 0;
        }
        
        .nav-footer {
          padding: 8px 0;
          border-top: 1px solid var(--border);
        }
        
        .nav-item {
          display: flex;
          align-items: center;
          height: 40px;
          padding: 0 14px;
          gap: 12px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: all 0.1s ease;
        }
        
        .nav-item:hover {
          color: var(--text-primary);
          background: var(--bg-hover);
        }
        
        .nav-item[data-active="true"] {
          color: var(--accent);
          background: rgba(0, 255, 136, 0.05);
        }
        
        .nav-item-icon {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .nav-item-label {
          font-size: 13px;
          font-weight: 500;
          white-space: nowrap;
        }
        
        /* Main */
        .main {
          flex: 1;
          margin-left: var(--nav-width);
          min-width: 0;
          transition: margin-right 0.2s ease;
        }
        
        .shell:has(.panel[data-open="true"]) .main {
          margin-right: var(--panel-width);
        }
        
        /* Panel */
        .panel {
          position: fixed;
          right: 0;
          top: 0;
          bottom: 0;
          width: var(--panel-width);
          background: var(--bg-secondary);
          border-left: 1px solid var(--border);
          transform: translateX(100%);
          transition: transform 0.2s ease;
          overflow-y: auto;
          z-index: 90;
        }
        
        .panel[data-open="true"] {
          transform: translateX(0);
        }
      `}</style>
        </div>
    );
}