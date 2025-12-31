

export type ClassEntry = {
  id: string;
  date: string;
  scheduledTime: string;
  entryTime: string;
  slideQAC: string;
  classStartTime: string;
  productType: string;
  course: string;
  subject: string;
  topic: string;
  teacher: string;
  teacher1Gmail: string;
  teacher2: string;
  teacher2Gmail: string;
  teacher3: string;
  teacher3Gmail: string;
  totalDuration: string;
  highestAttendance: string;
  averageAttendance: string;
  totalComments: string;
  issuesType: string;
  issuesDetails: string;
  slideCommunication: string;
  liveClassIssues: string;
  otherTechnicalIssues: string;
  satisfaction: string;
};

export type AppClassEntry = {
  id: string;
  date: string;
  product: string;
  subject: string;
  classTopic: string;
  scheduleTime: string;
  teacherEntryTime: string;
  slideQAC: string;
  classStartTime: string;
  teacher: string;
  teacher1Gmail: string;
  teacher2: string;
  teacher2Gmail: string;
  teacher3: string;
  teacher3Gmail: string;
  studio: string;
  currentlyEnrolledUser: string;
  totalAttendance: string;
  classAttendancePercent: string;
  classDuration: string;
  averageWatchtime: string;
  averageWatchtimePercent: string;
  averageClassRating: string;
  userRatedPercent: string;
  uniqueUsersRated: string;
  userCommentedPercent: string;
  totalDoubt: string;
  userDoubtedPercent: string;
  doubtStartedPercent: string;
  doubtResolvedPercent: string;
  pollParticipationPercent: string;
  avgPollEngagedPercent: string;
  issuesType: string;
  timeStamp: string;
  liveClassId: string;
  issueDetails: string;
  slideCommunication: string;
  liveClassIssues: string;
  otherTechnicalIssues: string;
  satisfaction: string;
};

export type CombinedClassEntry = Partial<ClassEntry> & Partial<AppClassEntry> & { id: string; dataSource: 'fb' | 'app' };

