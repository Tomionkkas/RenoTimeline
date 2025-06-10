import { createContext, useContext, useReducer, ReactNode } from 'react';
import { Task } from '@/hooks/useTasks';
import { Project } from '@/hooks/useProjects';

type Action =
  | { type: 'SET_TAB'; tab: string }
  | { type: 'SELECT_TASK'; task: Task }
  | { type: 'CLOSE_MODALS' }
  | { type: 'EDIT_PROJECT'; project: Project }
  | { type: 'CREATE_TASK' }
  | { type: 'CREATE_PROJECT' };

interface DashboardState {
  activeTab: string;
  selectedTask: Task | null;
  editingProject: Project | null;
  showCreateTaskDialog: boolean;
  showCreateProjectDialog: boolean;
}

const initialState: DashboardState = {
  activeTab: 'dashboard',
  selectedTask: null,
  editingProject: null,
  showCreateTaskDialog: false,
  showCreateProjectDialog: false,
};

const DashboardStateContext = createContext<DashboardState>(initialState);
const DashboardDispatchContext = createContext<React.Dispatch<Action>>(() => null);

function dashboardReducer(state: DashboardState, action: Action): DashboardState {
  switch (action.type) {
    case 'SET_TAB':
      return { ...state, activeTab: action.tab };
    case 'SELECT_TASK':
      // Close other modals when opening one
      return { 
        ...state, 
        editingProject: null, 
        selectedTask: action.task,
        showCreateTaskDialog: false,
        showCreateProjectDialog: false
      };
    case 'EDIT_PROJECT':
      return { 
        ...state, 
        selectedTask: null, 
        editingProject: action.project,
        showCreateTaskDialog: false,
        showCreateProjectDialog: false
      };
    case 'CREATE_TASK':
      return {
        ...state,
        activeTab: 'kanban',
        selectedTask: null,
        editingProject: null,
        showCreateTaskDialog: true,
        showCreateProjectDialog: false
      };
    case 'CREATE_PROJECT':
      return {
        ...state,
        activeTab: 'projects',
        selectedTask: null,
        editingProject: null,
        showCreateTaskDialog: false,
        showCreateProjectDialog: true
      };
    case 'CLOSE_MODALS':
      return { 
        ...state, 
        selectedTask: null, 
        editingProject: null,
        showCreateTaskDialog: false,
        showCreateProjectDialog: false
      };
    default:
      throw new Error(`Unhandled action type`);
  }
}

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  return (
    <DashboardStateContext.Provider value={state}>
      <DashboardDispatchContext.Provider value={dispatch}>
        {children}
      </DashboardDispatchContext.Provider>
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState() {
  return useContext(DashboardStateContext);
}

export function useDashboardDispatch() {
  return useContext(DashboardDispatchContext);
} 