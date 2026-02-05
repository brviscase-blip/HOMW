
export enum Priority {
  LOW = 'Baixa',
  MEDIUM = 'Média',
  HIGH = 'Alta'
}

export enum TaskStatus {
  TODO = 'Pendente',
  IN_PROGRESS = 'Em Andamento',
  COMPLETED = 'Concluída'
}

export enum TaskType {
  HABIT = 'HABITO',
  DAILY = 'COTIDIANO',
  TASK = 'TAREFA'
}

export interface TaskHistory {
  currentReps: number;
  status: TaskStatus;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  dueDate: string;
  days?: string[];
  createdAt: string;
  icon: string;
  iconColor: string;
  targetReps: number;
  currentReps: number;
  type: TaskType;
  history?: Record<string, TaskHistory>;
  timeWindow?: string;
}

// Novas interfaces para Demandas
export interface Area {
  id: string;
  name: string;
  created_at: string;
  demand_count?: number;
}

export interface Demand {
  id: string;
  area_id: string;
  description: string;
  status: 'PENDENTE' | 'CONCLUIDA';
  created_at: string;
}

export interface Routine {
  id: string;
  title: string;
  days: string[];
  time: string;
  category: string;
  completedDates: string[];
}

export interface AppState {
  tasks: Task[];
  routines: Routine[];
  userName: string;
}
