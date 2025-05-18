// Project and message types for the application

export interface Message {
  id: string
  content: string
  isUser: boolean
  timestamp: Date
  role: 'user' | 'assistant'
}

interface RepoInfo {
  repoName: string
  repoUrl: string
  deploymentUrl: string
}

export type ValidationStatus = {
  status: 'pending' | 'feasible' | 'too-complex' | 'inappropriate' | 'irrelevant'
  description: string
  name?: string
}

export interface Project {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  generatedCode: string
  repoInfo: RepoInfo | null
  deploymentStatus: 'pending' | 'success' | 'failure'
  validationStatus: ValidationStatus | null
}
