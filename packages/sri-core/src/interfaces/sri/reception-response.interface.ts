export interface ISriMessage {
  code?: string;
  message: string;
  additionalInfo?: string;
}

export interface IReceptionResponse {
  status: string;
  messages: ISriMessage[];
  rawXml?: string;
}
