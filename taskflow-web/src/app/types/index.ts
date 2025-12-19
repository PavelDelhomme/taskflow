export interface User {
  id: number
  username: string
  email?: string
  full_name: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  blocked_reason?: string
  trello_id?: string
  deleted_at?: string
  created_at?: string
  updated_at?: string
  started_at?: string
  completed_at?: string
  standby_at?: string
  due_date?: string
}

export interface Workflow {
  id: number
  name: string
  steps: string
  category: string
  project?: string
}

export interface AuthPageProps {
  darkMode: boolean
  showRegister: boolean
  setShowRegister: (value: boolean) => void
  loginForm: { email: string; password: string }
  setLoginForm: (form: { email: string; password: string }) => void
  registerForm: { username: string; email: string; password: string; full_name: string }
  setRegisterForm: (form: { username: string; email: string; password: string; full_name: string }) => void
  showLoginPassword: boolean
  setShowLoginPassword: (value: boolean) => void
  showRegisterPassword: boolean
  setShowRegisterPassword: (value: boolean) => void
  login: () => void
  register: () => void
}

