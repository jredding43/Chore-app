// src/types/chore.ts

export type WorkbookStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'not completed';

export interface WoodBook {
  id: number;
  title: string;
  points?: number;
}

export interface WorkbookAssignment {
  id: number;
  kidId: string;
  workBookId: number; 
  date: string;
  status: WorkbookStatus;
  timestamp?: string;
  points?: number; 
}


export interface KidWorkbookPointOverride {
  id?: number;
  kidId: string;
  workBookId: number;
  points: number;
}
