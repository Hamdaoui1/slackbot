export interface User {
  firstName: string;
  lastName: string;
  company: string;
  email: string;
  uid: string;
  companyId?: string;
  role: 'admin' | 'employee' | 'sub-admin'; 
  status: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
  approvedAt?: string;
}
