export interface KidProfile {
  id: string; 
  name: string;
  points: number;
  lifetimePoints: number;
  completedChores: number;
  rejectedChores: number;
  avatar?: string;
  rejectedWorkbooks?: number; 
  completedWorkbooks?: number;
  notCompletedChores?: number;
  pin: string;
}
