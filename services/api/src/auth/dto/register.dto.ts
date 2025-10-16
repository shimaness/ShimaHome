export class RegisterDto {
  email!: string;
  password!: string;
  role?: 'TENANT' | 'LANDLORD' | 'ADMIN';
}
