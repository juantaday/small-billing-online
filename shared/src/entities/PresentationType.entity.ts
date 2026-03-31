export interface CreatePresentationTypeDto {
  name: string;
  active?: boolean;
}

export interface PresentationTypeDto extends CreatePresentationTypeDto {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UpdatePresentationTypeDto extends Partial<CreatePresentationTypeDto> {
  id: string;
}
