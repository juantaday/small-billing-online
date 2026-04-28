import { IAuthorization } from './authorization.interface';

export interface IAuthorizationResponse {
  status: string;
  accessKey: string;
  authorizations: IAuthorization[];
  rawXml?: string;
}
