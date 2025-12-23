import { Gender } from '../enums/Gender.enum';

// DTO para crear usuario (registro)
export interface CreateUserDto {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth: Date | string; // Acepta ambos
  codUser?: string;
  address?: string;
  alias: string;
  urlImage?: string;
  password: string;
  peopleId?: string;
}

// DTO de respuesta (sin password)
export interface UserDto {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  confirmedEmail: boolean;
  phoneNumber?: string;
  gender: Gender;
  dateOfBirth: Date;
  codUser?: string;
  address?: string;
  alias: string;
  urlImage?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  peopleId?: string;
}

// DTO para login
export interface LoginDto {
  email: string;
  password: string;
}

// DTO para actualizar usuario
export interface UpdateUserDto extends Partial<Omit<CreateUserDto, 'password' | 'email'>> {
  id: string;
}

// DTO de respuesta de autenticación
export interface AuthResponseDto {
  user: UserDto;
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}