export interface User {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  uid: string;
  role: 'admin' | 'employee';
  status?: 'pending' | 'approved';
} 