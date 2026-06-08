import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const STORE_VERSION = 2

export const useProjectStore = create(
  persist(
    (set, get) => ({
      projects: [],
      currentProject: null,
      setCurrentProject: (project) => set({ currentProject: project }),
      addProject: (project) => set((state) => ({ projects: [...state.projects, project] })),
      updateProject: (id, updates) => set((state) => ({
        projects: state.projects.map(p => p.id === id ? { ...p, ...updates } : p),
        currentProject: state.currentProject?.id === id ? { ...state.currentProject, ...updates } : state.currentProject
      }))
    }),
    {
      name: 'virtual-engineer-storage',
      version: STORE_VERSION,
      migrate: (persistedState, version) => {
        // Se la versione è diversa o i dati hanno una forma inattesa, reset pulito
        if (version !== STORE_VERSION || !persistedState || typeof persistedState !== 'object') {
          return { projects: [], currentProject: null }
        }
        return {
          projects: Array.isArray(persistedState.projects) ? persistedState.projects : [],
          currentProject: persistedState.currentProject ?? null,
        }
      }
    }
  )
)
