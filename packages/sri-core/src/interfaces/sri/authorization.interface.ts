import { ISriMessage } from './reception-response.interface';

export interface IAuthorization {
  number: string;
  date: string;
  status: string;
  xml: string;
  messages?: ISriMessage[];
}
