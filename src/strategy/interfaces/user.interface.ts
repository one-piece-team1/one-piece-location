export interface UserInfo {
  id?: string;
  role?: string;
  username?: string;
  email?: string;
  licence?: string;
  expiredDate?: string;
  [futureKey: string]: any;
}
