import type { HTMLAttributes, ReactNode } from 'react';

export function WMIdentitySurface({ children, className = '', ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={`auth-shell wm-identity-surface ${className}`.trim()} data-wm-identity-surface="" {...props}>{children}</div>;
}

export function WMIdentityPanel({ kicker, title, description, children, className = '', ...props }: HTMLAttributes<HTMLElement> & Readonly<{ kicker: string; title: string; description?: string; children: ReactNode }>) {
  return <main id="main" className={`auth-panel wm-identity-panel ${className}`.trim()} aria-labelledby="wm-authentication-title" {...props}>
    <header className="wm-identity-panel-header">
      <span className="auth-kicker wm-identity-kicker">{kicker}</span>
      <h1 id="wm-authentication-title">{title}</h1>
      {description ? <p className="wm-identity-description">{description}</p> : null}
    </header>
    <div className="wm-identity-panel-body">{children}</div>
  </main>;
}

export function WMIdentityBrand({ children }: Readonly<{ children: ReactNode }>) {
  return <div className="auth-brand wm-identity-brand" data-wm-identity-brand="">{children}</div>;
}

export function WMAccountSurface({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <main id="main" className={`page account-page wm-account-surface ${className}`.trim()} data-wm-account-surface="" tabIndex={-1} {...props}>{children}</main>;
}

export function WMAccountSection({ children, className = '', ...props }: HTMLAttributes<HTMLElement>) {
  return <section className={`settings-card wm-account-section ${className}`.trim()} {...props}>{children}</section>;
}
