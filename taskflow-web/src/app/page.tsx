'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User, Target, Clock, BarChart3, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import Cookies from 'js-cookie'

interface User {
  id: number
  username: string
  full_name: string
  email: string
}

interface LoginData {
  username: string
  password: string
}

interface RegisterData {
  username: string
  email: string
  password: string
  full_name: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [showLogin, setShowLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  // Vérifier si utilisateur connecté au chargement
  useEffect(() => {
    const token = Cookies.get('access_token')
    if (token) {
      fetchUserInfo(token)
    }
  }, [])

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        toast.success(`Bon retour ${userData.full_name || userData.username} !`)
      } else {
        Cookies.remove('access_token')
      }
    } catch (error) {
      console.error('Erreur récupération utilisateur:', error)
      Cookies.remove('access_token')
    }
  }

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const loginData: LoginData = {
      username: formData.get('username') as string,
      password: formData.get('password') as string,
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (response.ok) {
        Cookies.set('access_token', data.access_token, { expires: 1 }) // 1 jour
        setUser(data.user)
        toast.success(`Connexion réussie ! Bienvenue ${data.user.full_name || data.user.username}`)
        router.push('/dashboard')
      } else {
        toast.error(data.detail || 'Erreur de connexion')
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur')
      console.error('Erreur login:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const registerData: RegisterData = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      password: formData.get('password') as string,
      full_name: formData.get('full_name') as string,
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registerData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Inscription réussie ! Vous pouvez maintenant vous connecter')
        setShowLogin(true)
      } else {
        toast.error(data.detail || 'Erreur d\\'inscription')
      }
    } catch (error) {
      toast.error('Erreur de connexion au serveur')
      console.error('Erreur register:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    Cookies.remove('access_token')
    setUser(null)
    toast.success('Déconnexion réussie')
  }

  const initDemoData = async () => {
    const token = Cookies.get('access_token')
    if (!token) return

    try {
      const response = await fetch(`${API_BASE}/api/demo/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast.success('Données de démonstration ajoutées !')
        router.push('/dashboard')
      } else {
        toast.error('Erreur lors de l\\'ajout des données de démo')
      }
    } catch (error) {
      toast.error('Erreur de connexion')
      console.error('Erreur demo:', error)
    }
  }

  if (user) {
    return (
      <div className="min-vh-100 bg-dark">
        {/* Header */}
        <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
          <div className="container-fluid">
            <span className="navbar-brand mb-0 h1">
              🎯 TaskFlow ADHD
            </span>
            <div className="d-flex">
              <span className="navbar-text me-3">
                Bienvenue {user.full_name || user.username}
              </span>
              <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                Déconnexion
              </button>
            </div>
          </div>
        </nav>

        {/* Contenu principal */}
        <div className="container-fluid py-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="text-center mb-5">
                <h1 className="display-4 text-light mb-3">
                  🚀 Tableau de Bord TaskFlow ADHD
                </h1>
                <p className="lead text-light-emphasis mb-4">
                  Gérez vos tâches, suivez votre focus et préparez vos daily meetings
                </p>
              </div>

              {/* Cards d'actions */}
              <div className="row g-4">
                <div className="col-md-6 col-lg-3">
                  <div className="card bg-success text-white h-100">
                    <div className="card-body text-center">
                      <Target size={48} className="mb-3" />
                      <h5 className="card-title">Mes Tâches</h5>
                      <p className="card-text">Gérer et suivre toutes vos tâches en cours</p>
                      <button 
                        className="btn btn-light" 
                        onClick={() => router.push('/tasks')}
                      >
                        Voir les tâches
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card bg-info text-white h-100">
                    <div className="card-body text-center">
                      <Clock size={48} className="mb-3" />
                      <h5 className="card-title">Focus Sessions</h5>
                      <p className="card-text">Enregistrer vos sessions de travail concentré</p>
                      <button 
                        className="btn btn-light"
                        onClick={() => router.push('/focus')}
                      >
                        Démarrer focus
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card bg-warning text-dark h-100">
                    <div className="card-body text-center">
                      <Calendar size={48} className="mb-3" />
                      <h5 className="card-title">Daily Meeting</h5>
                      <p className="card-text">Préparer votre rapport quotidien</p>
                      <button 
                        className="btn btn-dark"
                        onClick={() => router.push('/daily')}
                      >
                        Daily d\\'aujourd\\'hui
                      </button>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card bg-secondary text-white h-100">
                    <div className="card-body text-center">
                      <BarChart3 size={48} className="mb-3" />
                      <h5 className="card-title">Statistiques</h5>
                      <p className="card-text">Analyser votre productivité ADHD</p>
                      <button 
                        className="btn btn-light"
                        onClick={() => router.push('/stats')}
                      >
                        Voir stats
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action démo */}
              <div className="row mt-5">
                <div className="col-12 text-center">
                  <div className="card bg-dark border-primary">
                    <div className="card-body">
                      <h5 className="card-title text-light">Première fois ?</h5>
                      <p className="card-text text-light-emphasis">
                        Ajoutez des données de démonstration pour tester l\\'application
                      </p>
                      <button className="btn btn-primary" onClick={initDemoData}>
                        🎯 Ajouter des tâches de démo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center">
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            {/* Header */}
            <div className="text-center mb-5">
              <h1 className="display-4 text-light mb-3">
                🎯 TaskFlow ADHD
              </h1>
              <p className="lead text-light-emphasis">
                Système de tracking professionnel optimisé pour TDAH
              </p>
              <p className="text-muted">
                Développé par Paul Delhomme
              </p>
            </div>

            {/* Tabs */}
            <div className="card bg-secondary">
              <div className="card-header">
                <ul className="nav nav-tabs card-header-tabs" role="tablist">
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`nav-link ${showLogin ? 'active' : ''}`}
                      onClick={() => setShowLogin(true)}
                    >
                      <User size={16} className="me-2" />
                      Connexion
                    </button>
                  </li>
                  <li className="nav-item" role="presentation">
                    <button 
                      className={`nav-link ${!showLogin ? 'active' : ''}`}
                      onClick={() => setShowLogin(false)}
                    >
                      Inscription
                    </button>
                  </li>
                </ul>
              </div>

              <div className="card-body">
                {showLogin ? (
                  <form onSubmit={handleLogin}>
                    <div className="mb-3">
                      <label className="form-label text-light">Nom d\\'utilisateur</label>
                      <input 
                        type="text" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="username"
                        placeholder="paul"
                        required 
                      />
                      <div className="form-text text-muted">
                        Utilisateur de démo: <strong>paul</strong>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label text-light">Mot de passe</label>
                      <input 
                        type="password" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="password"
                        placeholder="paul123"
                        required 
                      />
                      <div className="form-text text-muted">
                        Mot de passe de démo: <strong>paul123</strong>
                      </div>
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : null}
                      Se connecter
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleRegister}>
                    <div className="mb-3">
                      <label className="form-label text-light">Nom complet</label>
                      <input 
                        type="text" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="full_name"
                        placeholder="Votre nom complet"
                        required 
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label text-light">Nom d\\'utilisateur</label>
                      <input 
                        type="text" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="username"
                        placeholder="username"
                        required 
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label text-light">Email</label>
                      <input 
                        type="email" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="email"
                        placeholder="votre@email.com"
                        required 
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label text-light">Mot de passe</label>
                      <input 
                        type="password" 
                        className="form-control bg-dark text-light border-secondary" 
                        name="password"
                        placeholder="Mot de passe sécurisé"
                        required 
                      />
                    </div>
                    
                    <button 
                      type="submit" 
                      className="btn btn-success w-100"
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2" />
                      ) : null}
                      S\\'inscrire
                    </button>
                  </form>
                )}
              </div>
            </div>

            {/* Info API avec NOUVEAUX PORTS */}
            <div className="text-center mt-4">
              <small className="text-muted">
                🔥 API: http://localhost:8008/api/docs | 
                🌐 Web: http://localhost:3003
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}