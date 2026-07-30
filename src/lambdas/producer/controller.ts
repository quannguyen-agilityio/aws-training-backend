import { ApiGatewayProxyEvent, ApiResponse } from '@shared/types';
import { PlayerService } from '@shared/services';
import { success, accepted, badRequest, internalError, buildResponse } from '@shared/utils';

export class ProducerController {
  private readonly playerService: PlayerService;

  constructor(playerService: PlayerService = new PlayerService()) {
    this.playerService = playerService;
  }

  async handle(event: ApiGatewayProxyEvent): Promise<ApiResponse> {
    const method =
      event.httpMethod ||
      (event.requestContext && event.requestContext.http && event.requestContext.http.method) ||
      'GET';

    console.log(`[ProducerController] Incoming request method: ${method}`);

    try {
      switch (method.toUpperCase()) {
        case 'OPTIONS':
          return success({ message: 'CORS preflight successful' });

        case 'POST': {
          let body: Record<string, unknown> = {};
          if (event.body) {
            try {
              body =
                typeof event.body === 'string'
                  ? JSON.parse(event.body)
                  : (event.body as Record<string, unknown>);
            } catch {
              return badRequest('Invalid JSON body');
            }
          }

          const result = await this.playerService.registerPlayer(
            body as unknown as Parameters<PlayerService['registerPlayer']>[0]
          );
          return accepted({
            message: 'Player registration accepted and queued for background onboarding.',
            ...result,
          });
        }

        case 'GET': {
          const players = await this.playerService.getAllPlayers();
          return success(players);
        }

        case 'DELETE': {
          let body: Record<string, unknown> = {};
          if (event.body) {
            try {
              body =
                typeof event.body === 'string'
                  ? JSON.parse(event.body)
                  : (event.body as Record<string, unknown>);
            } catch {
              return badRequest('Invalid JSON body');
            }
          }

          const teamId = (body.teamId as string) || event.queryStringParameters?.teamId;
          const playerId =
            (body.playerId as string) ||
            event.pathParameters?.playerId ||
            event.queryStringParameters?.playerId;

          if (!teamId || !playerId) {
            return badRequest(
              'Validation Error: teamId and playerId are required for delete operation.'
            );
          }

          await this.playerService.deletePlayer(teamId, playerId);
          return success({ message: 'Player deleted successfully!' });
        }

        default:
          return buildResponse(405, { message: `Method ${method} Not Allowed` });
      }
    } catch (err: unknown) {
      console.error('[ProducerController] Error handling request:', err);

      const errorMessage = err instanceof Error ? err.message : String(err || '');
      if (errorMessage && errorMessage.startsWith('Validation Error')) {
        return badRequest(errorMessage);
      }

      return internalError('Internal Server Error', err);
    }
  }
}
