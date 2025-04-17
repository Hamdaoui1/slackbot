declare module '*.tsx' {
  import { ReactElement } from 'react';
  
  export interface Team {
    id: string;
    name: string;
    companyId: string;
    members: string[];
  }

  export interface SubAdmin {
    id: string;
    companyId: string;
  }

  const SubAdminTeams: React.FC;
  export default SubAdminTeams;
} 