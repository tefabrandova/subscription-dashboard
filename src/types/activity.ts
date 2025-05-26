export type ActivityType = 
  | 'create'
  | 'update'
  | 'delete'
  | 'login'
  | 'logout'
  | 'view';

export type ObjectType =
  | 'account'
  | 'package'
  | 'customer'
  | 'subscription'
  | 'user';

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  actionType: ActivityType;
  objectType: ObjectType;
  objectId: string;
  objectName: string;
  details: string;
  timestamp: string;
}