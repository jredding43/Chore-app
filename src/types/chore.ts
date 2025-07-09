// src/types/chore.ts

export type ChoreStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'not completed';

export interface ChoreTemplate {
  id: number;
  title: string;
  points: number;
  weeklyAssignment?: {
    [day: string]: string | null; // key = M, T, W, etc. | value = kidId or null
  };
}

export interface ChoreAssignment {
  id: number;
  choreId: number; // points to ChoreTemplate
  assignedTo: string; // 'kid1' or 'kid2'
  date: string; // ISO date like '2025-07-04'
  status: ChoreStatus;
  timestamp?: string;
}
