/**
 * Entity: User
 * Modelo de datos y API para usuarios
 */

import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import { UserDto, LoginDto,  AuthResponseDto } from '@small-billing/shared';

class UserApi extends BaseApiClient {
  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async login(credentials: LoginDto): Promise<AuthResponseDto> {
    return this.post<AuthResponseDto>('/auth/login', credentials);
  }

  async register(data: LoginDto): Promise<AuthResponseDto> {
    return this.post<AuthResponseDto>('/auth/register', data);
  }

  async getProfile(): Promise<UserDto> {
    return this.get<UserDto>('/auth/profile');
  }

  async refreshToken(refreshToken: string): Promise<AuthResponseDto> {
    return this.post<AuthResponseDto>('/auth/refresh', { refreshToken });
  }
}

export const userApi = new UserApi();
