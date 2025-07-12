import Dexie, { Table } from 'dexie';
import { ChoreTemplate } from './types/chore';
import { KidProfile } from './types/kids';
import { WoodBook, WorkbookAssignment, KidWorkbookPointOverride } from './types/workbooks'; 
import { ExtraChoreTemplate, ExtraChoreAssignment } from './types/extrachores';

export interface ChoreStatus {
  id: string; 
  kidId: string;
  choreId: number;
  date: string; 
  status: 'completed' | 'rejected' | 'not completed';
  reason?: string;
}

export interface PendingReward {
  id?: number;
  kidId: string;
  rewardName: string;
  cost: number;
  redeemedAt: string;
  redeemed?: boolean;
  requestedForCashIn: boolean;
}

export class ChoreDB extends Dexie {
  choreTemplates!: Table<ChoreTemplate, number>;
  extraChoreTemplates!: Table<ExtraChoreTemplate, number>;
  extraChoreAssignments!: Table<ExtraChoreAssignment, number>; 
  kidProfiles!: Table<KidProfile, string>;
  choreStatuses!: Table<ChoreStatus, string>;
  woodBooks!: Table<WoodBook, number>;
  workbookAssignments!: Table<WorkbookAssignment, number>;
  pendingRewards!: Table<PendingReward, number>;
  kidWorkbookPointOverrides!: Table<KidWorkbookPointOverride, number>; 

  constructor() {
    super('ChoreDatabase');
    this.version(3).stores({
      choreTemplates: '++id, title, points',
      extraChoreTemplates: '++id, title, points',
      extraChoreAssignments: '++id, choreId, assignedTo, date, status', 
      kidProfiles: 'id, name, points, lifetimepoint, completedchores, rejectedchores',
      choreStatuses: 'id, kidId, choreId, date, status',
      woodBooks: '++id, title, points',
      workbookAssignments: '++id, workBookId, kidId, date, status',
      pendingRewards: '++id, kidId, rewardName, cost, redeemedAt, redeemed, requestedForCashIn',
      kidWorkbookPointOverrides: '++id, kidId, workBookId', 
    });
  }
}

export const db = new ChoreDB();
