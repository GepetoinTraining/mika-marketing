// app/(protected)/onboarding/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { useWorkspace } from '@/lib/workspace/context';
import { TextInput, Select, Loader } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconBuilding, IconArrowRight, IconCheck } from '@tabler/icons-react';

const industries = [
    { value: 'education', label: 'Educação' },
    { value: 'restaurant', label: 'Restaurante / Food' },
    { value: 'ecommerce', label: 'E-commerce' },
    { value: 'saas', label: 'SaaS / Software' },
    { value: 'healthcare', label: 'Saúde' },
    { value: 'real_estate', label: 'Imobiliário' },
    { value: 'finance', label: 'Finanças / Investimentos' },
    { value: 'fitness', label: 'Fitness / Bem-estar' },
    { value: 'beauty', label: 'Beleza / Estética' },
    { value: 'legal', label: 'Jurídico' },
    { value: 'agency', label: 'Agência de Marketing' },
    { value: 'other', label: 'Outro' },
];

export default function OnboardingPage() {
    const router = useRouter();
    const { user, isLoaded: userLoaded } = useUser();
    const { workspaces, workspacesLoading, switchWorkspace, refreshWorkspaces } = useWorkspace();

    const [step, setStep] = useState<'loading' | 'select' | 'create'>('loading');
    const [creating, setCreating] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        industry: '',
        description: '',
    });

    useEffect(() => {
        if (!userLoaded || workspacesLoading) return;

        if (workspaces.length === 0) {
            setStep('create');
        } else if (workspaces.length === 1) {
            handleSelectWorkspace(workspaces[0].id);
        } else {
            setStep('select');
        }
    }, [userLoaded, workspacesLoading, workspaces]);

    const handleSelectWorkspace = async (workspaceId: string) => {
        await switchWorkspace(workspaceId);
        router.push('/dashboard');
    };

    const handleCreateWorkspace = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            notifications.show({
                title: 'Erro',
                message: 'Nome é obrigatório',
                color: 'red',
            });
            return;
        }

        setCreating(true);

        try {
            const res = await fetch('/api/workspaces', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const error = await res.json();
                throw new Error(error.error || 'Failed to create workspace');
            }

            const workspace = await res.json();

            notifications.show({
                title: 'Sucesso',
                message: 'Workspace criado!',
                color: 'teal',
            });

            refreshWorkspaces();
            await switchWorkspace(workspace.id);
            router.push('/dashboard');
        } catch (error) {
            notifications.show({
                title: 'Erro',
                message: error instanceof Error ? error.message : 'Erro ao criar workspace',
                color: 'red',
            });
        } finally {
            setCreating(false);
        }
    };

    if (step === 'loading' || !userLoaded || workspacesLoading) {
        return (
            <div className="loading-screen">
                <Loader color="teal" size="lg" />
                <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
          }
        `}</style>
            </div>
        );
    }

    if (step === 'select') {
        return (
            <div className="onboarding">
                <div className="card">
                    <div className="card-icon">
                        <IconBuilding size={24} />
                    </div>
                    <h1 className="card-title">Selecione um Workspace</h1>
                    <p className="card-desc">Escolha qual workspace você quer acessar</p>

                    <div className="workspace-list">
                        {workspaces.map((ws) => (
                            <button
                                key={ws.id}
                                onClick={() => handleSelectWorkspace(ws.id)}
                                className="workspace-btn"
                            >
                                <div className="workspace-info">
                                    <span className="workspace-name">{ws.name}</span>
                                    {ws.isMaster && <span className="badge">Principal</span>}
                                </div>
                                <IconArrowRight size={18} className="workspace-arrow" />
                            </button>
                        ))}
                    </div>

                    {user?.publicMetadata?.globalRole === 'owner' && (
                        <button className="btn-ghost full" onClick={() => setStep('create')}>
                            Criar Novo Workspace
                        </button>
                    )}
                </div>

                <style jsx>{`
          .onboarding {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: var(--bg-primary);
            padding: 24px;
          }
          
          .card {
            width: 100%;
            max-width: 420px;
            background: var(--bg-secondary);
            border: 1px solid var(--border);
            padding: 32px;
          }
          
          .card-icon {
            width: 48px;
            height: 48px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(0, 255, 136, 0.1);
            color: var(--accent);
            margin-bottom: 24px;
          }
          
          .card-title {
            font-size: 20px;
            font-weight: 600;
            margin: 0 0 8px 0;
          }
          
          .card-desc {
            font-size: 13px;
            color: var(--text-secondary);
            margin: 0 0 24px 0;
          }
          
          .workspace-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            margin-bottom: 24px;
          }
          
          .workspace-btn {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            padding: 16px;
            background: var(--bg-tertiary);
            border: 1px solid var(--border);
            color: var(--text-primary);
            cursor: pointer;
            transition: all 0.1s;
          }
          
          .workspace-btn:hover {
            border-color: var(--accent);
            background: var(--bg-hover);
          }
          
          .workspace-info {
            display: flex;
            align-items: center;
            gap: 12px;
          }
          
          .workspace-name {
            font-weight: 500;
          }
          
          .badge {
            font-size: 10px;
            font-weight: 600;
            padding: 4px 8px;
            background: rgba(0, 255, 136, 0.1);
            color: var(--accent);
          }
          
          .workspace-arrow {
            color: var(--text-muted);
            transition: color 0.1s;
          }
          
          .workspace-btn:hover .workspace-arrow {
            color: var(--accent);
          }
          
          .btn-ghost {
            width: 100%;
            padding: 12px;
            background: none;
            border: 1px solid var(--border);
            color: var(--text-secondary);
            font-size: 13px;
            cursor: pointer;
            transition: all 0.1s;
          }
          
          .btn-ghost:hover {
            border-color: var(--text-muted);
            color: var(--text-primary);
          }
        `}</style>
            </div>
        );
    }

    // Create form
    return (
        <div className="onboarding">
            <form className="card" onSubmit={handleCreateWorkspace}>
                <div className="card-icon">
                    <IconBuilding size={24} />
                </div>
                <h1 className="card-title">
                    {workspaces.length === 0 ? 'Bem-vindo!' : 'Criar Workspace'}
                </h1>
                <p className="card-desc">
                    {workspaces.length === 0
                        ? 'Vamos configurar seu primeiro workspace'
                        : 'Adicione um novo cliente ou projeto'
                    }
                </p>

                <div className="form-fields">
                    <TextInput
                        label="Nome do Workspace"
                        placeholder="Ex: Minha Empresa ou Nome do Cliente"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={creating}
                        required
                        styles={{
                            input: {
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: 0,
                            },
                        }}
                    />

                    <Select
                        label="Indústria"
                        placeholder="Selecione a indústria"
                        data={industries}
                        value={formData.industry}
                        onChange={(value) => setFormData({ ...formData, industry: value || '' })}
                        disabled={creating}
                        styles={{
                            input: {
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: 0,
                            },
                        }}
                    />

                    <TextInput
                        label="Descrição (opcional)"
                        placeholder="Uma breve descrição do negócio"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={creating}
                        styles={{
                            input: {
                                background: 'var(--bg-tertiary)',
                                border: '1px solid var(--border)',
                                borderRadius: 0,
                            },
                        }}
                    />
                </div>

                <button type="submit" className="btn-primary full" disabled={creating}>
                    {creating ? (
                        <Loader size="sm" color="dark" />
                    ) : (
                        <>
                            Criar Workspace
                            <IconArrowRight size={16} />
                        </>
                    )}
                </button>

                {workspaces.length > 0 && (
                    <button
                        type="button"
                        className="btn-ghost full"
                        onClick={() => setStep('select')}
                    >
                        Voltar para seleção
                    </button>
                )}
            </form>

            <style jsx>{`
        .onboarding {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-primary);
          padding: 24px;
        }
        
        .card {
          width: 100%;
          max-width: 420px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 32px;
        }
        
        .card-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 255, 136, 0.1);
          color: var(--accent);
          margin-bottom: 24px;
        }
        
        .card-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .card-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0 0 24px 0;
        }
        
        .form-fields {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 24px;
        }
        
        .btn-primary {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 14px;
          background: var(--accent);
          color: var(--bg-primary);
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: background 0.1s;
          margin-bottom: 12px;
        }
        
        .btn-primary:hover:not(:disabled) {
          background: var(--accent-dim);
        }
        
        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        
        .btn-ghost {
          width: 100%;
          padding: 12px;
          background: none;
          border: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
          cursor: pointer;
          transition: all 0.1s;
        }
        
        .btn-ghost:hover {
          border-color: var(--text-muted);
          color: var(--text-primary);
        }
      `}</style>
        </div>
    );
}