import { ApiGatewayProxyEvent, ApiResponse } from '@shared/types';
import { ProducerController } from './controller';

const controller = new ProducerController();

export async function handler(event: ApiGatewayProxyEvent): Promise<ApiResponse> {
  return controller.handle(event);
}
