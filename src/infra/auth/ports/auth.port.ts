export interface AuthUserDto {
  userId: string;
  email: string;
  emailVerified: boolean;
  username?: string;
  phoneNumber?: string;
  phoneVerified?: boolean;
  picture?: string;
  name?: string;
  blocked?: boolean;
  givenName?: string;
  familyName?: string;
}

export abstract class AuthPort {
  abstract getUserInfo(userId: string): Promise<AuthUserDto>;
  abstract createUser(email: string, password: string): Promise<AuthUserDto>;
  abstract updatePassword(userId: string, newPassword: string): Promise<AuthUserDto>;
  abstract disableUser(userId: string): Promise<AuthUserDto>;
  abstract deleteUser(userId: string): Promise<void>;
}
