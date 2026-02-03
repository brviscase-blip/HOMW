
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

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  category: string;
  dueDate: string;
  days?: string[]; // Dias da semana para tarefas recorrentes
  createdAt: string;
  icon: string;
  iconColor: string;
  targetReps: number;
  currentReps: number;
}

export interface Routine {
  id: string;
  title: string;
  days: string[]; // ['Seg', 'Ter'...]
  time: string;
  category: string;
  completedDates: string[]; // ISO Strings of days completed
}

export interface AppState {
  tasks: Task[];
  routines: Routine[];
  userName: string;
}
