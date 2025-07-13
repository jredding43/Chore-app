export type DaySummary = {
  completed: { title: string; points: number }[];
  rejected: string[];
  notCompleted: string[];
  points: number;
};

export type KidChoreSummary = {
  [kidId: string]: {
    [day: string]: DaySummary;
  };
};
