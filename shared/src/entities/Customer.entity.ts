import { CreateCustomerCategoryDto } from "./CustomerCategory.entity";
import { CreatePeopleDto, PeopleDto } from "./People.entity";

// DTO para crear cliente (incluye datos de People)
export interface CreateCustomerDto {
  people: CreatePeopleDto; // Datos de la persona
  customerCategoryId: string; // Categoría del cliente
  preferredPaymentMethod?: string;
}

// DTO de respuesta
export interface CustomerDto {
  id: string;
  peopleId: string;
  customerCategoryId: string;
  totalPurchases: number;
  lastPurchaseDate?: Date | null;
  loyaltyPoints: number;
  preferredPaymentMethod?: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// DTO para actualizar (solo campos que puede modificar, no people)
export interface UpdateCustomerDto {
  id: string;
  customerCategoryId?: string;
  preferredPaymentMethod?: string;
  people?: Partial<CreatePeopleDto>; // Permitir actualizar datos de people
}

// DTO completo con relaciones pobladas
export interface CustomerWithRelationsDto extends CustomerDto {
  people?: PeopleDto;
  customerCategory?: CreateCustomerCategoryDto; 
}
