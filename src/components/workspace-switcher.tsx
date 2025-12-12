// components/workspace-switcher.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspace } from '@/lib/workspace/context';
import { Menu, Loader } from '@mantine/core';
import {
    IconBuilding,
    IconCheck,
    IconChevronDown,
    IconPlus,
    IconSettings
} from '@tabler/icons-react';

export function WorkspaceSwitcher() {
    const router = useRouter();
    const {
        workspace,
        workspaces,
        workspacesLoading,
        isLoading,
        switchWorkspace,
        isOwner,
    } = useWorkspace();

    const [switching, setSwitching] = useState(false);

    const handleSwitch = async (workspaceId: string) => {
        if (workspaceId === workspace?.id) return;

        setSwitching(true);
        await switchWorkspace(workspaceId);
        setSwitching(false);
        router.refresh();
    };

    if (isLoading || workspacesLoading) {
        return (
            <button className="switcher-btn" disabled>
                <Loader size="xs" color="gray" />
                <span>Carregando...</span>
                <style jsx>{`
          .switcher-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 13px;
            cursor: not-allowed;
          }
        `}</style>
            </button>
        );
    }

    if (!workspace) {
        return (
            <button
                className="switcher-btn"
                onClick={() => router.push('/onboarding')}
            >
                <IconBuilding size={16} />
                <span>Selecionar Workspace</span>
                <style jsx>{`
          .switcher-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            font-size: 13px;
            cursor: pointer;
            transition: border-color 0.1s;
          }
          .switcher-btn:hover {
            border-color: var(--accent);
          }
        `}</style>
            </button>
        );
    }

    return (
        <>
            <Menu shadow="md" width={220} position="bottom-start">
                <Menu.Target>
                    <button className="switcher-btn" disabled={switching}>
                        {switching ? (
                            <Loader size="xs" color="teal" />
                        ) : (
                            <IconBuilding size={16} />
                        )}
                        <span className="workspace-name">{workspace.name}</span>
                        <IconChevronDown size={14} className="chevron" />
                    </button>
                </Menu.Target>

                <Menu.Dropdown
                    style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: 0,
                    }}
                >
                    <Menu.Label style={{ color: 'var(--text-muted)', fontSize: 10 }}>
                        WORKSPACES
                    </Menu.Label>

                    {workspaces.map((ws) => (
                        <Menu.Item
                            key={ws.id}
                            onClick={() => handleSwitch(ws.id)}
                            leftSection={<IconBuilding size={14} />}
                            rightSection={ws.id === workspace.id ? <IconCheck size={14} color="var(--accent)" /> : null}
                            style={{
                                borderRadius: 0,
                                color: ws.id === workspace.id ? 'var(--accent)' : 'var(--text-primary)',
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {ws.name}
                                {ws.isMaster && (
                                    <span style={{
                                        fontSize: 9,
                                        padding: '2px 6px',
                                        background: 'rgba(0, 255, 136, 0.1)',
                                        color: 'var(--accent)',
                                    }}>
                                        PRINCIPAL
                                    </span>
                                )}
                            </div>
                        </Menu.Item>
                    ))}

                    {isOwner && (
                        <>
                            <Menu.Divider style={{ borderColor: 'var(--border)' }} />

                            <Menu.Item
                                leftSection={<IconPlus size={14} />}
                                onClick={() => router.push('/onboarding?create=true')}
                                style={{ borderRadius: 0 }}
                            >
                                Adicionar Cliente
                            </Menu.Item>

                            <Menu.Item
                                leftSection={<IconSettings size={14} />}
                                onClick={() => router.push('/settings/workspaces')}
                                style={{ borderRadius: 0 }}
                            >
                                Gerenciar Workspaces
                            </Menu.Item>
                        </>
                    )}
                </Menu.Dropdown>
            </Menu>

            <style jsx>{`
        .switcher-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          color: var(--text-primary);
          font-size: 13px;
          cursor: pointer;
          transition: border-color 0.1s;
          min-width: 180px;
        }
        
        .switcher-btn:hover {
          border-color: var(--accent);
        }
        
        .switcher-btn:disabled {
          cursor: wait;
        }
        
        .workspace-name {
          flex: 1;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .chevron {
          color: var(--text-muted);
        }
      `}</style>
        </>
    );
}