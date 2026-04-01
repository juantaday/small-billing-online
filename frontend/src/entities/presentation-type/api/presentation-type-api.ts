import { BaseApiClient } from '@/shared/api';
import { API_CONFIG } from '@/shared/config';
import {
  CreatePresentationTypeDto,
  PresentationTypeDto,
  UpdatePresentationTypeDto,
} from '@small-billing/shared';

class PresentationTypeApi extends BaseApiClient {
  private presentationTypesCache: PresentationTypeDto[] | null = null;
  private presentationTypesFetchedAt = 0;
  private inflightGetAll: Promise<PresentationTypeDto[]> | null = null;

  constructor() {
    super(API_CONFIG.BASE_URL);
  }

  async getAll(): Promise<PresentationTypeDto[]> {
    const now = Date.now();
    const CACHE_TTL_MS = 60_000;

    if (
      this.presentationTypesCache &&
      now - this.presentationTypesFetchedAt < CACHE_TTL_MS
    ) {
      return this.presentationTypesCache;
    }

    if (this.inflightGetAll) {
      return this.inflightGetAll;
    }

    this.inflightGetAll = this.get<PresentationTypeDto[]>('/presentation-types')
      .then((data) => {
        this.presentationTypesCache = data;
        this.presentationTypesFetchedAt = Date.now();
        return data;
      })
      .finally(() => {
        this.inflightGetAll = null;
      });

    return this.inflightGetAll;
  }

  async create(data: CreatePresentationTypeDto): Promise<PresentationTypeDto> {
    const created = await this.post<PresentationTypeDto>('/presentation-types', data);
    this.presentationTypesCache = null;
    this.presentationTypesFetchedAt = 0;
    return created;
  }

  async update(id: string, data: UpdatePresentationTypeDto): Promise<PresentationTypeDto> {
    const updated = await this.put<PresentationTypeDto>(`/presentation-types/${id}`, data);
    this.presentationTypesCache = null;
    this.presentationTypesFetchedAt = 0;
    return updated;
  }

  async delete(id: string): Promise<PresentationTypeDto> {
    const deleted = await this.deleteBase<PresentationTypeDto>(`/presentation-types/${id}`);
    this.presentationTypesCache = null;
    this.presentationTypesFetchedAt = 0;
    return deleted;
  }
}

export const presentationTypeApi = new PresentationTypeApi();
