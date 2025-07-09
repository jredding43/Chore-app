

export type ExtraChoreStatus = 'pending' | 'submitted' | 'approved' | 'rejected' | 'not completed';

export interface ExtraChoreTemplate {
  id: number;
  title: string;
  points: number;
}

export interface ExtraChoreAssignment {
  id: number;
  choreId: number; 
  assignedTo: string; 
  date: string; 
  status: ExtraChoreStatus;
  timestamp?: string;
  partialPoints?: boolean;
}
