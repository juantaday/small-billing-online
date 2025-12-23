import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto, LoginDto, UserDto } from '@small-billing/shared';

const prisma = new PrismaClient();

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // Registrar usuario
  async register(data: CreateUserDto): Promise<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }> {
    // Verificar si el email ya existe
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Convertir dateOfBirth a Date si viene como string
    const dateOfBirth = typeof data.dateOfBirth === 'string' 
      ? new Date(data.dateOfBirth) 
      : data.dateOfBirth;

    // Crear usuario
    const user = await prisma.user.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        gender: data.gender,
        dateOfBirth: dateOfBirth, // ← Usar la variable convertida
        codUser: data.codUser,
        address: data.address,
        alias: data.alias,
        urlImage: data.urlImage,
        password: hashedPassword,
        peopleId: data.peopleId,
      },
    });

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Guardar refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    // Eliminar password de la respuesta
    const { password, refreshToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData as UserDto,
      tokens,
    };
  }

  // Login
  async login(data: LoginDto): Promise<{ user: UserDto; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!user.active) {
      throw new UnauthorizedException('Usuario inactivo');
    }

    // Generar tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Guardar refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...userWithoutSensitiveData } = user;

    return {
      user: userWithoutSensitiveData as UserDto,
      tokens,
    };
  }

  // Refresh tokens
  async refreshTokens(userId: string, refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Verificar refresh token
    const refreshTokenMatches = await bcrypt.compare(refreshToken, user.refreshToken);

    if (!refreshTokenMatches) {
      throw new UnauthorizedException('Acceso denegado');
    }

    // Generar nuevos tokens
    const tokens = await this.generateTokens(user.id, user.email);

    // Actualizar refresh token
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // Logout
  async logout(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  // Generar tokens
  private async generateTokens(userId: string, email: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key',
      expiresIn: '15m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key',
      expiresIn: '7d',
    });

    return { accessToken, refreshToken };
  }

  // Actualizar refresh token en BD
  private async updateRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashedRefreshToken },
    });
  }
}