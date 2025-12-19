'use client'

import { AuthPageProps } from '../types'

export default function AuthPage({
  darkMode,
  showRegister,
  setShowRegister,
  loginForm,
  setLoginForm,
  registerForm,
  setRegisterForm,
  showLoginPassword,
  setShowLoginPassword,
  showRegisterPassword,
  setShowRegisterPassword,
  login,
  register,
}: AuthPageProps) {
  return (
    <div className={`auth-container ${darkMode ? 'dark' : 'light'}`}>
      <div className="auth-background">
        <div className="auth-gradient"></div>
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🎯</div>
          <h1 className="auth-title">TaskFlow ADHD</h1>
          <p className="auth-subtitle">
            {!showRegister ? 'Connectez-vous à votre espace' : 'Créez votre compte'}
          </p>
        </div>

        {!showRegister ? (
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); login(); }}>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="login-email">Email</label>
              <div className="password-toggle">
                <input
                  id="login-email"
                  type="email"
                  className="form-input-modern"
                  placeholder="votre@email.com"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="login-password">Mot de passe</label>
              <div className="password-toggle">
                <input
                  id="login-password"
                  type={showLoginPassword ? 'text' : 'password'}
                  className="form-input-modern"
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowLoginPassword(!showLoginPassword)}
                >
                  {showLoginPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-auth-primary">
              Se connecter
            </button>
            <div className="auth-divider">
              <span>ou</span>
            </div>
            <button
              type="button"
              className="btn-auth-secondary"
              onClick={() => setShowRegister(true)}
            >
              Créer un compte
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(e) => { e.preventDefault(); register(); }}>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="register-username">Nom d'utilisateur</label>
              <input
                id="register-username"
                type="text"
                className="form-input-modern"
                placeholder="johndoe"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                required
              />
            </div>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="register-fullname">Nom complet</label>
              <input
                id="register-fullname"
                type="text"
                className="form-input-modern"
                placeholder="John Doe"
                value={registerForm.full_name}
                onChange={(e) => setRegisterForm({ ...registerForm, full_name: e.target.value })}
                required
              />
            </div>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="register-email">Email</label>
              <input
                id="register-email"
                type="email"
                className="form-input-modern"
                placeholder="votre@email.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
            </div>
            <div className="form-group-modern">
              <label className="form-label-modern" htmlFor="register-password">Mot de passe</label>
              <div className="password-toggle">
                <input
                  id="register-password"
                  type={showRegisterPassword ? 'text' : 'password'}
                  className="form-input-modern"
                  placeholder="••••••••"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                >
                  {showRegisterPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-auth-primary">
              S'inscrire
            </button>
            <div className="auth-divider">
              <span>ou</span>
            </div>
            <button
              type="button"
              className="btn-auth-secondary"
              onClick={() => setShowRegister(false)}
            >
              Se connecter
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

