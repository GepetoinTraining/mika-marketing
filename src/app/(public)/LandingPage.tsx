'use client';

import Link from 'next/link';
import {
  IconArrowRight,
  IconChartBar,
  IconBrain,
  IconStack2,
  IconPalette,
  IconShield,
  IconBolt
} from '@tabler/icons-react';

export default function LandingPageClient() {
  return (
    <div className="landing">
      {/* Header */}
      <header className="header">
        <Link href="/" className="logo">
          MarketingOS
        </Link>

        <nav className="nav">
          <Link href="#features" className="nav-link">Recursos</Link>
          <Link href="#pricing" className="nav-link">Preços</Link>
          <Link href="#about" className="nav-link">Sobre</Link>
        </nav>

        <div className="header-actions">
          <Link href="/sign-in" className="btn-ghost">
            Entrar
          </Link>
          <Link href="/sign-up" className="btn-primary">
            Começar Grátis
            <IconArrowRight size={16} />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-badge">
          <IconBolt size={14} />
          Powered by AI
        </div>

        <h1 className="hero-title">
          Marketing analytics com{' '}
          <span className="accent">inteligência artificial</span>
        </h1>

        <p className="hero-subtitle">
          Unifique seus dados de Meta Ads, Google Ads e CRM.
          Deixe a IA identificar problemas antes que você perceba.
        </p>

        <div className="hero-actions">
          <Link href="/sign-up" className="btn-primary btn-lg">
            Começar Gratuitamente
            <IconArrowRight size={18} />
          </Link>
          <Link href="#demo" className="btn-ghost btn-lg">
            Ver Demo
          </Link>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-value mono">5min</span>
            <span className="stat-label">Setup time</span>
          </div>
          <div className="stat-item">
            <span className="stat-value mono">30%</span>
            <span className="stat-label">Tempo economizado</span>
          </div>
          <div className="stat-item">
            <span className="stat-value mono">24/7</span>
            <span className="stat-label">Monitoramento</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features">
        <h2 className="section-title">Tudo que você precisa em um só lugar</h2>
        <p className="section-subtitle">
          Pare de alternar entre 10 abas. Veja tudo unificado,
          com insights gerados por IA em tempo real.
        </p>

        <div className="features-grid">
          <FeatureCard
            icon={<IconChartBar size={24} />}
            title="Analytics Unificado"
            description="Meta Ads, Google Ads, CRM e e-commerce em um único dashboard. Sem mais planilhas manuais."
          />
          <FeatureCard
            icon={<IconBrain size={24} />}
            title="IA que Aprende"
            description="O sistema aprende com suas campanhas passadas e fica mais inteligente a cada dia."
          />
          <FeatureCard
            icon={<IconBolt size={24} />}
            title="Alertas Proativos"
            description="Receba alertas antes que problemas virem crises. A IA monitora 24/7."
          />
          <FeatureCard
            icon={<IconStack2 size={24} />}
            title="Landing Pages em Minutos"
            description="Crie páginas otimizadas com IA. Copy, design e métricas integradas."
          />
          <FeatureCard
            icon={<IconPalette size={24} />}
            title="Brand Manager"
            description="Sistema de tokens de design que garante consistência em todas as peças."
          />
          <FeatureCard
            icon={<IconShield size={24} />}
            title="Multi-Client"
            description="Gerencie múltiplos clientes com workspaces isolados e permissões granulares."
          />
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2 className="cta-title">Pronto para transformar seu marketing?</h2>
        <p className="cta-subtitle">
          Comece gratuitamente. Sem cartão de crédito. Configure em 5 minutos.
        </p>
        <Link href="/sign-up" className="btn-primary btn-lg">
          Criar Conta Grátis
          <IconArrowRight size={18} />
        </Link>
      </section>

      {/* Footer */}
      <footer className="footer">
        <span className="footer-logo">MarketingOS</span>
        <span className="footer-copy">
          © {new Date().getFullYear()} MarketingOS. Todos os direitos reservados.
        </span>
      </footer>

      <style jsx>{`
        .landing {
          min-height: 100vh;
          background: var(--bg-primary);
        }
        
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 32px;
          border-bottom: 1px solid var(--border);
          position: sticky;
          top: 0;
          background: var(--bg-primary);
          z-index: 100;
        }
        
        .logo {
          font-size: 18px;
          font-weight: 700;
          color: var(--accent);
          text-decoration: none;
        }
        
        .nav {
          display: flex;
          gap: 32px;
        }
        
        .nav-link {
          font-size: 13px;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.1s;
        }
        
        .nav-link:hover {
          color: var(--text-primary);
        }
        
        .header-actions {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .btn-ghost {
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          transition: color 0.1s;
        }
        
        .btn-ghost:hover {
          color: var(--text-primary);
        }
        
        .btn-primary {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: var(--accent);
          color: var(--bg-primary);
          font-size: 13px;
          font-weight: 600;
          text-decoration: none;
          border: none;
          cursor: pointer;
          transition: background 0.1s;
        }
        
        .btn-primary:hover {
          background: var(--accent-dim);
        }
        
        .btn-lg {
          padding: 14px 28px;
          font-size: 14px;
        }
        
        .hero {
          text-align: center;
          padding: 80px 32px;
          max-width: 900px;
          margin: 0 auto;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          background: rgba(0, 255, 136, 0.1);
          color: var(--accent);
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 24px;
        }
        
        .hero-title {
          font-size: 48px;
          font-weight: 700;
          line-height: 1.1;
          margin: 0 0 24px 0;
          color: var(--text-primary);
        }
        
        .accent {
          color: var(--accent);
        }
        
        .hero-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          margin: 0 0 40px 0;
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .hero-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          margin-bottom: 60px;
        }
        
        .stats-row {
          display: flex;
          justify-content: center;
          gap: 64px;
          padding-top: 40px;
          border-top: 1px solid var(--border);
        }
        
        .stat-item {
          text-align: center;
        }
        
        .stat-value {
          display: block;
          font-size: 32px;
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .stat-label {
          font-size: 12px;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        
        .features {
          padding: 80px 32px;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .section-title {
          font-size: 32px;
          font-weight: 700;
          text-align: center;
          margin: 0 0 16px 0;
        }
        
        .section-subtitle {
          font-size: 16px;
          color: var(--text-secondary);
          text-align: center;
          margin: 0 0 48px 0;
        }
        
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
        }
        
        .cta-section {
          background: var(--accent);
          padding: 80px 32px;
          text-align: center;
        }
        
        .cta-title {
          font-size: 32px;
          font-weight: 700;
          color: var(--bg-primary);
          margin: 0 0 16px 0;
        }
        
        .cta-subtitle {
          font-size: 16px;
          color: var(--bg-primary);
          opacity: 0.8;
          margin: 0 0 32px 0;
        }
        
        .cta-section .btn-primary {
          background: var(--bg-primary);
          color: var(--accent);
        }
        
        .cta-section .btn-primary:hover {
          background: var(--bg-secondary);
        }
        
        .footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 32px;
          border-top: 1px solid var(--border);
        }
        
        .footer-logo {
          font-weight: 700;
          color: var(--text-primary);
        }
        
        .footer-copy {
          font-size: 13px;
          color: var(--text-muted);
        }
        
        @media (max-width: 768px) {
          .nav { display: none; }
          .hero-title { font-size: 32px; }
          .features-grid { grid-template-columns: 1fr; }
          .stats-row { flex-direction: column; gap: 24px; }
        }
      `}</style>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="feature-card">
      <div className="feature-icon">{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{description}</p>

      <style jsx>{`
        .feature-card {
          padding: 24px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          transition: border-color 0.1s;
        }
        
        .feature-card:hover {
          border-color: var(--accent);
        }
        
        .feature-icon {
          width: 48px;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0, 255, 136, 0.1);
          color: var(--accent);
          margin-bottom: 16px;
        }
        
        .feature-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: var(--text-primary);
        }
        
        .feature-desc {
          font-size: 13px;
          color: var(--text-secondary);
          margin: 0;
          line-height: 1.6;
        }
      `}</style>
    </div>
  );
}