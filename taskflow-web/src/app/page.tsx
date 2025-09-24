'use client'

import { useState, useEffect } from 'react'
import 'bootstrap/dist/css/bootstrap.min.css'

interface User {
  id: number
  username: string
  email?: string
  full_name: string
}

interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  blocked_reason?: string
  trello_id?: string
  created_at: string
  updated_at: string
}

interface Workflow {
  id: number
  name: string
  steps: string
  category: string
}

export default function TaskflowPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [workflows, setWorkflows] = useState<Workflow[]>([])
  const [token, setToken] = useState<string>('')
  const [user, setUser] = useState<User | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [darkMode, setDarkMode] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDailyModal, setShowDailyModal] = useState(false)
  const [showWeeklyModal, setShowWeeklyModal] = useState(false)
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [showReminderModal, setShowReminderModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [dailySummary, setDailySummary] = useState('')
  const [weeklySummary, setWeeklySummary] = useState('')
  const [reminderMessage, setReminderMessage] = useState('')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null)
  
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  })
  
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: ''
  })
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'medium',
    trello_id: ''
  })

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8008'

  useEffect(() => {
    // Ajouter les styles CSS personnalisés
    const style = document.createElement('style')
    style.textContent = `
      /* Placeholders visibles en mode sombre */
      .bg-dark input::placeholder,
      .bg-dark textarea::placeholder {
        color: #adb5bd !important;
        opacity: 1;
      }
      
      input::placeholder,
      textarea::placeholder {
        color: #6c757d !important;
        opacity: 1;
      }
      
      .form-control:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
      }
      
      .bg-dark .form-control:focus {
        border-color: #0d6efd;
        box-shadow: 0 0 0 0.2rem rgba(13, 110, 253, 0.25);
        background-color: #343a40;
        color: white;
      }
      
      .bg-dark .form-select {
        background-color: #343a40;
        border-color: #495057;
        color: white;
      }
      
      .bg-dark .form-select option {
        background-color: #343a40;
        color: white;
      }
      
      .card {
        border-radius: 10px;
      }
      
      .btn {
        border-radius: 6px;
      }
    `
    document.head.appendChild(style)

    const savedToken = localStorage.getItem('token')
    if (savedToken) {
      setToken(savedToken)
      setIsLoggedIn(true)
      fetchTasks(savedToken)
      fetchWorkflows(savedToken)
      checkForReminders(savedToken)
      initNotifications()
      
      const interval = setInterval(() => {
        checkForReminders(savedToken)
      }, 30 * 60 * 1000)
      
      return () => clearInterval(interval)
    }

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  const initNotifications = async () => {
    if ('Notification' in window && 'serviceWorker' in navigator) {
      const permission = await Notification.requestPermission()
      setNotificationsEnabled(permission === 'granted')
    }
  }

  const sendNotification = (title: string, body: string, options?: NotificationOptions) => {
    if (notificationsEnabled && 'Notification' in window) {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'taskflow-reminder',
        ...options
      })
    }
  }

  const fetchTasks = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    }
  }

  const fetchWorkflows = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/workflows`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWorkflows(data)
      }
    } catch (error) {
      console.error('Error fetching workflows:', error)
    }
  }

  const checkForReminders = async (authToken: string) => {
    try {
      const response = await fetch(`${API_URL}/workflows/remind-new-ticket`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        if (data.needs_ticket) {
          setReminderMessage(data.message)
          sendNotification(
            '🎯 TaskFlow ADHD - Rappel',
            'Aucune tâche active ! Prendre un nouveau ticket Trello.',
            { tag: 'no-active-tasks' }
          )
          setTimeout(() => setShowReminderModal(true), 2000)
        }
      }
    } catch (error) {
      console.error('Error checking reminders:', error)
    }
  }

  const fetchDailySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/daily-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setDailySummary(data.summary)
        setShowDailyModal(true)
      }
    } catch (error) {
      console.error('Error fetching daily summary:', error)
    }
  }

  const fetchWeeklySummary = async () => {
    try {
      const response = await fetch(`${API_URL}/reports/weekly-summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setWeeklySummary(data.summary)
        setShowWeeklyModal(true)
      }
    } catch (error) {
      console.error('Error fetching weekly summary:', error)
    }
  }

  const login = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(loginForm)
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setIsLoggedIn(true)
        fetchTasks(data.access_token)
        fetchWorkflows(data.access_token)
        checkForReminders(data.access_token)
        initNotifications()
      } else {
        const error = await response.json()
        alert('Erreur de connexion: ' + error.detail)
        console.error('Login error:', error)
      }
    } catch (error) {
      console.error('Login error:', error)
      alert('Erreur de connexion')
    }
  }

  const register = async () => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(registerForm)
      })

      if (response.ok) {
        const data = await response.json()
        setToken(data.access_token)
        setUser(data.user)
        localStorage.setItem('token', data.access_token)
        setIsLoggedIn(true)
        setShowRegister(false)
        fetchTasks(data.access_token)
        fetchWorkflows(data.access_token)
        initNotifications()
      } else {
        const error = await response.json()
        alert("Erreur d'inscription: " + error.detail)
        console.error('Register error:', error)
      }
    } catch (error) {
      console.error('Register error:', error)
      alert("Erreur d'inscription")
    }
  }

  const logout = () => {
    setToken('')
    setUser(null)
    localStorage.removeItem('token')
    setIsLoggedIn(false)
    setTasks([])
    setNotificationsEnabled(false)
  }

  const createTask = async () => {
    try {
      const response = await fetch(`${API_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newTask)
      })

      if (response.ok) {
        setNewTask({ title: '', description: '', priority: 'medium', trello_id: '' })
        setShowCreateModal(false)
        fetchTasks(token)
        sendNotification('✅ Tâche créée', `"${newTask.title}" a été ajoutée`)
      }
    } catch (error) {
      console.error('Error creating task:', error)
    }
  }

  const updateTask = async (taskId: number, updates: any) => {
    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      })

      if (response.ok) {
        fetchTasks(token)
        setShowEditModal(false)
        setSelectedTask(null)
        
        if (updates.status === 'done') {
          sendNotification('🎉 Tâche terminée !', 'Bravo ! Pense à prendre un nouveau ticket.')
        } else if (updates.status === 'blocked') {
          sendNotification('🚫 Tâche bloquée', "N'oublie pas de débloquer ou prendre un autre ticket.")
        } else if (updates.status === 'standby') {
          sendNotification('⏸️ Tâche en standby', 'Tâche mise en pause. Prendre un autre ticket ?')
        }
        
        setTimeout(() => checkForReminders(token), 1000)
      }
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const deleteTask = async (taskId: number) => {
    if (!confirm('Supprimer cette tâche ?')) return

    try {
      const response = await fetch(`${API_URL}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        fetchTasks(token)
        checkForReminders(token)
        sendNotification('🗑️ Tâche supprimée', 'La tâche a été supprimée')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copié dans le presse-papiers!')
  }

  const handleTaskAction = (task: Task, action: string) => {
    switch (action) {
      case 'start':
        updateTask(task.id, { status: 'in_progress' })
        break
      case 'block':
        const reason = prompt('Raison du blocage:')
        if (reason) {
          updateTask(task.id, { status: 'blocked', blocked_reason: reason })
        }
        break
      case 'standby':
        updateTask(task.id, { status: 'standby' })
        break
      case 'review':
        updateTask(task.id, { status: 'review' })
        break
      case 'complete':
        updateTask(task.id, { status: 'done' })
        break
      case 'resume':
        updateTask(task.id, { status: 'in_progress', blocked_reason: null })
        break
      case 'edit':
        setSelectedTask(task)
        setShowEditModal(true)
        break
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'todo': 'bg-secondary',
      'in_progress': 'bg-primary',
      'blocked': 'bg-danger',
      'standby': 'bg-warning text-dark',
      'review': 'bg-info text-white',
      'done': 'bg-success'
    }
    
    const labels = {
      'todo': 'À faire',
      'in_progress': 'En cours',
      'blocked': 'Bloqué',
      'standby': 'Standby',
      'review': 'Review',
      'done': 'Terminé'
    }

    return <span className={`badge ${badges[status as keyof typeof badges]}`}>
      {labels[status as keyof typeof labels]}
    </span>
  }

  const getPriorityBadge = (priority: string) => {
    const badges = {
      'low': 'bg-info',
      'medium': 'bg-secondary',
      'high': 'bg-warning text-dark',
      'urgent': 'bg-danger'
    }
    
    return <span className={`badge ${badges[priority as keyof typeof badges]} ms-2`}>
      {priority}
    </span>
  }

  const getTaskActions = (task: Task) => {
    const actions = []
    
    if (task.status === 'todo') {
      actions.push(
        <button key="start" className="btn btn-primary btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'start')}>
          ▶️ Commencer
        </button>
      )
    }
    
    if (task.status === 'in_progress') {
      actions.push(
        <button key="standby" className="btn btn-warning btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'standby')}>
          ⏸️ Standby
        </button>,
        <button key="block" className="btn btn-danger btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'block')}>
          🚫 Bloquer
        </button>,
        <button key="review" className="btn btn-info btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'review')}>
          ⏳ Review
        </button>,
        <button key="complete" className="btn btn-success btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'complete')}>
          ✅ Terminer
        </button>
      )
    }
    
    if (task.status === 'blocked' || task.status === 'done' || task.status === 'standby' || task.status === 'review') {
      actions.push(
        <button key="resume" className="btn btn-primary btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'resume')}>
          🔄 Reprendre
        </button>
      )
    }
    
    actions.push(
      <button key="edit" className="btn btn-outline-secondary btn-sm me-1 mb-1" onClick={() => handleTaskAction(task, 'edit')}>
        ✏️ Modifier
      </button>,
      <button key="delete" className="btn btn-outline-danger btn-sm mb-1" onClick={() => deleteTask(task.id)}>
        🗑️ Supprimer
      </button>
    )
    
    return actions
  }

  const activeTasks = tasks.filter(t => t.status === 'in_progress')
  const needsNewTicket = activeTasks.length === 0 && tasks.length > 0

  if (!isLoggedIn) {
    return (
      <div className={`min-vh-100 d-flex align-items-center justify-content-center ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
        <div className="card" style={{ width: '100%', maxWidth: '400px' }}>
          <div className={`card-body ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
            <h2 className="card-title text-center mb-4">🎯 TaskFlow ADHD</h2>
            
            {!showRegister ? (
              <>
                <h5 className="text-center mb-3">Connexion</h5>
                <div className="mb-3">
                  <input
                    type="email"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Email (exemple: paul@delhomme.ovh)"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && login()}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Mot de passe"
                    value={loginForm.password}
                    onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                    onKeyPress={(e) => e.key === 'Enter' && login()}
                  />
                </div>
                <button className="btn btn-primary w-100 mb-2" onClick={login}>
                  Se connecter
                </button>
                <button className="btn btn-outline-secondary w-100" onClick={() => setShowRegister(true)}>
                  Créer un compte
                </button>
                <div className="mt-3 small text-muted">
                  <strong>Compte de test :</strong><br/>
                  Email: paul@delhomme.ovh<br/>
                  Mot de passe: 2H8'Z&sx@QW+X=v,dz[tnsv$F
                </div>
              </>
            ) : (
              <>
                <h5 className="text-center mb-3">Inscription</h5>
                <div className="mb-3">
                  <input
                    type="text"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Nom d'utilisateur (exemple: pauld)"
                    value={registerForm.username}
                    onChange={(e) => setRegisterForm({...registerForm, username: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="email"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Email (doit finir par @delhomme.ovh)"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm({...registerForm, email: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="text"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Nom complet (exemple: Paul Delhomme)"
                    value={registerForm.full_name}
                    onChange={(e) => setRegisterForm({...registerForm, full_name: e.target.value})}
                  />
                </div>
                <div className="mb-3">
                  <input
                    type="password"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    placeholder="Mot de passe (minimum 6 caractères)"
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm({...registerForm, password: e.target.value})}
                  />
                </div>
                <button className="btn btn-primary w-100 mb-2" onClick={register}>
                  S'inscrire
                </button>
                <button className="btn btn-outline-secondary w-100" onClick={() => setShowRegister(false)}>
                  Retour connexion
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-vh-100 ${darkMode ? 'bg-dark text-white' : 'bg-light'}`}>
      <nav className={`navbar sticky-top ${darkMode ? 'navbar-dark bg-dark border-bottom border-secondary' : 'navbar-light bg-white'} shadow-sm`}>
        <div className="container-fluid">
          <span className="navbar-brand">🎯 TaskFlow ADHD</span>
          <span className="text-muted small d-none d-md-inline">👤 {user?.full_name}</span>
          <div className="d-flex flex-wrap gap-1">
            <button 
              className="btn btn-outline-primary btn-sm" 
              onClick={() => setShowCreateModal(true)}
            >
              ➕ <span className="d-none d-md-inline">Tâche</span>
            </button>
            <button 
              className="btn btn-outline-success btn-sm" 
              onClick={fetchDailySummary}
            >
              📋 <span className="d-none d-md-inline">Daily</span>
            </button>
            <button 
              className="btn btn-outline-info btn-sm" 
              onClick={fetchWeeklySummary}
            >
              📊 <span className="d-none d-md-inline">Weekly</span>
            </button>
            <button 
              className="btn btn-outline-warning btn-sm" 
              onClick={() => setShowWorkflowModal(true)}
            >
              📋 <span className="d-none d-md-inline">Workflows</span>
            </button>
            <button 
              className={`btn btn-outline-${notificationsEnabled ? 'success' : 'secondary'} btn-sm`} 
              onClick={() => setShowNotificationModal(true)}
              title="Notifications"
            >
              🔔
            </button>
            <button 
              className={`btn btn-outline-${darkMode ? 'light' : 'dark'} btn-sm`} 
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="btn btn-outline-danger btn-sm" onClick={logout}>
              <span className="d-none d-md-inline">Déconnexion</span>
              <span className="d-md-none">❌</span>
            </button>
          </div>
        </div>
      </nav>

      {needsNewTicket && (
        <div className="container mt-3">
          <div className="alert alert-warning d-flex align-items-center" role="alert">
            <div className="flex-grow-1">
              ⚠️ <strong>Aucune tâche active !</strong> 
              Pense à prendre un nouveau ticket sur Trello → Tests-Auto ou MEP Tech/Backlog/Sprint.
            </div>
            <button 
              className="btn btn-sm btn-outline-warning ms-2"
              onClick={() => setShowReminderModal(true)}
            >
              Détails
            </button>
          </div>
        </div>
      )}

      <div className="container mt-4">
        <div className="row g-3">
          <div className="col-12 col-lg-6">
            <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="card-header bg-primary text-white">
                <h6 className="mb-0">🔄 En cours ({tasks.filter(t => t.status === 'in_progress').length})</h6>
              </div>
              <div className="card-body">
                {tasks.filter(t => t.status === 'in_progress').map(task => (
                  <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <div className="card-body p-2">
                      <h6 className="card-title mb-1 small">{task.title}</h6>
                      {task.trello_id && (
                        <small className="text-info d-block mb-1">
                          🔗 Trello: {task.trello_id}
                        </small>
                      )}
                      {task.description && (
                        <p className="card-text small text-muted mb-1">{task.description}</p>
                      )}
                      <div className="mb-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {getTaskActions(task)}
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'in_progress').length === 0 && (
                  <p className="text-muted small">Aucune tâche en cours</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="card-header bg-secondary text-white">
                <h6 className="mb-0">📋 À faire ({tasks.filter(t => t.status === 'todo').length})</h6>
              </div>
              <div className="card-body">
                {tasks.filter(t => t.status === 'todo').slice(0, 5).map(task => (
                  <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <div className="card-body p-2">
                      <h6 className="card-title mb-1 small">{task.title}</h6>
                      {task.trello_id && (
                        <small className="text-info d-block mb-1">
                          🔗 Trello: {task.trello_id}
                        </small>
                      )}
                      <div className="mb-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {getTaskActions(task)}
                      </div>
                    </div>
                  </div>
                ))}
                {tasks.filter(t => t.status === 'todo').length > 5 && (
                  <small className="text-muted">... et {tasks.filter(t => t.status === 'todo').length - 5} autres</small>
                )}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="card-header bg-warning text-dark">
                <h6 className="mb-0">⏸️ Standby ({tasks.filter(t => t.status === 'standby').length})</h6>
              </div>
              <div className="card-body">
                {tasks.filter(t => t.status === 'standby').map(task => (
                  <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <div className="card-body p-2">
                      <h6 className="card-title mb-1 small">{task.title}</h6>
                      {task.trello_id && (
                        <small className="text-info d-block mb-1">
                          🔗 Trello: {task.trello_id}
                        </small>
                      )}
                      <div className="mb-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {getTaskActions(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12 col-lg-6">
            <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="card-header bg-danger text-white">
                <h6 className="mb-0">🚫 Bloqué ({tasks.filter(t => t.status === 'blocked').length})</h6>
              </div>
              <div className="card-body">
                {tasks.filter(t => t.status === 'blocked').map(task => (
                  <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                    <div className="card-body p-2">
                      <h6 className="card-title mb-1 small">{task.title}</h6>
                      {task.trello_id && (
                        <small className="text-info d-block mb-1">
                          🔗 Trello: {task.trello_id}
                        </small>
                      )}
                      {task.blocked_reason && (
                        <div className="alert alert-danger py-1 mb-1 small">
                          <strong>Blocage:</strong> {task.blocked_reason}
                        </div>
                      )}
                      <div className="mb-2">
                        {getStatusBadge(task.status)}
                        {getPriorityBadge(task.priority)}
                      </div>
                      <div className="d-flex flex-wrap gap-1">
                        {getTaskActions(task)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-12">
            <div className="row g-3">
              <div className="col-lg-6">
                <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">⏳ En Review ({tasks.filter(t => t.status === 'review').length})</h6>
                  </div>
                  <div className="card-body">
                    {tasks.filter(t => t.status === 'review').map(task => (
                      <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                        <div className="card-body p-2">
                          <h6 className="card-title mb-1 small">{task.title}</h6>
                          {task.trello_id && (
                            <small className="text-info d-block mb-1">
                              🔗 Trello: {task.trello_id}
                            </small>
                          )}
                          <div className="mb-2">
                            {getStatusBadge(task.status)}
                            {getPriorityBadge(task.priority)}
                          </div>
                          <div className="d-flex flex-wrap gap-1">
                            {getTaskActions(task)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-lg-6">
                <div className={`card ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">✅ Terminé ({tasks.filter(t => t.status === 'done').length})</h6>
                  </div>
                  <div className="card-body">
                    {tasks.filter(t => t.status === 'done').slice(0, 3).map(task => (
                      <div key={task.id} className={`card mb-2 ${darkMode ? 'bg-secondary text-white border-secondary' : ''}`}>
                        <div className="card-body p-2">
                          <h6 className="card-title mb-1 small">{task.title}</h6>
                          {task.trello_id && (
                            <small className="text-info d-block mb-1">
                              🔗 Trello: {task.trello_id}
                            </small>
                          )}
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => handleTaskAction(task, 'resume')}
                            >
                              🔄
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {tasks.filter(t => t.status === 'done').length > 3 && (
                      <small className="text-muted">... et {tasks.filter(t => t.status === 'done').length - 3} autres</small>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Création tâche */}
      {showCreateModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowCreateModal(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">➕ Nouvelle tâche</h5>
                <button className="btn-close" onClick={() => setShowCreateModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Titre *</label>
                  <input
                    type="text"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="Ex: Implémenter API Platform"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Description</label>
                  <textarea
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    rows={3}
                    value={newTask.description}
                    onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                    placeholder="Détails de la tâche..."
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">ID Ticket Trello (optionnel)</label>
                  <input
                    type="text"
                    className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    value={newTask.trello_id}
                    onChange={(e) => setNewTask({...newTask, trello_id: e.target.value})}
                    placeholder="Ex: abc123def456"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Priorité</label>
                  <select
                    className={`form-select ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                    value={newTask.priority}
                    onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Basse</option>
                    <option value="medium">Moyenne</option>
                    <option value="high">Haute</option>
                    <option value="urgent">Urgente</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setShowCreateModal(false)}>
                  Annuler
                </button>
                <button className="btn btn-primary" onClick={createTask} disabled={!newTask.title}>
                  Créer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Daily Summary */}
      {showDailyModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowDailyModal(false)}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">📋 Daily Summary</h5>
                <button className="btn-close" onClick={() => setShowDailyModal(false)}></button>
              </div>
              <div className="modal-body">
                <textarea
                  className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                  rows={20}
                  value={dailySummary}
                  onChange={(e) => setDailySummary(e.target.value)}
                  style={{fontFamily: 'monospace'}}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => copyToClipboard(dailySummary)}>
                  📋 Copier
                </button>
                <button className="btn btn-secondary" onClick={() => setShowDailyModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Weekly Summary */}
      {showWeeklyModal && (
        <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}} onClick={() => setShowWeeklyModal(false)}>
          <div className="modal-dialog modal-lg" onClick={e => e.stopPropagation()}>
            <div className={`modal-content ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}>
              <div className="modal-header">
                <h5 className="modal-title">📊 Weekly Summary</h5>
                <button className="btn-close" onClick={() => setShowWeeklyModal(false)}></button>
              </div>
              <div className="modal-body">
                <textarea
                  className={`form-control ${darkMode ? 'bg-dark text-white border-secondary' : ''}`}
                  rows={20}
                  value={weeklySummary}
                  onChange={(e) => setWeeklySummary(e.target.value)}
                  style={{fontFamily: 'monospace'}}
                />
              </div>
              <div className="modal-footer">
                <button className="btn btn-success" onClick={() => copyToClipboard(weeklySummary)}>
                  📋 Copier
                </button>
                <button className="btn btn-secondary" onClick={() => setShowWeeklyModal(false)}>
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}