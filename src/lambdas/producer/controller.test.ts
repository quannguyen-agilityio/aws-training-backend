import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProducerController } from './controller';
import { PlayerService } from '@shared/services';
import { ApiGatewayProxyEvent } from '@shared/types';

describe('ProducerController Unit Tests', () => {
  let controller: ProducerController;
  let mockPlayerService: PlayerService;

  beforeEach(() => {
    mockPlayerService = {
      registerPlayer: vi.fn(),
      getAllPlayers: vi.fn(),
      getPlayerByKey: vi.fn(),
      deletePlayer: vi.fn(),
    } as unknown as PlayerService;

    controller = new ProducerController(mockPlayerService);
  });

  it('should handle OPTIONS preflight request', async () => {
    const event: ApiGatewayProxyEvent = { httpMethod: 'OPTIONS' };
    const res = await controller.handle(event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: 'CORS preflight successful' });
  });

  it('should handle POST player registration successfully', async () => {
    const body = { teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' };
    const event: ApiGatewayProxyEvent = {
      httpMethod: 'POST',
      body: JSON.stringify(body),
    };

    vi.mocked(mockPlayerService.registerPlayer).mockResolvedValue({
      status: 'QUEUED',
      eventId: 'evt-123',
      messageId: 'msg-123',
      playerId: 'P1',
      teamId: 'TeamA',
    });

    const res = await controller.handle(event);

    expect(res.statusCode).toBe(202);
    const resData = JSON.parse(res.body);
    expect(resData.status).toBe('QUEUED');
    expect(resData.eventId).toBe('evt-123');
    expect(mockPlayerService.registerPlayer).toHaveBeenCalledWith(body);
  });

  it('should handle GET all players request', async () => {
    const players = [{ teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' }];
    vi.mocked(mockPlayerService.getAllPlayers).mockResolvedValue(players);

    const event: ApiGatewayProxyEvent = { httpMethod: 'GET' };
    const res = await controller.handle(event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual(players);
  });

  it('should handle DELETE player request', async () => {
    const event: ApiGatewayProxyEvent = {
      httpMethod: 'DELETE',
      body: JSON.stringify({ teamId: 'TeamA', playerId: 'P1' }),
    };

    vi.mocked(mockPlayerService.deletePlayer).mockResolvedValue();

    const res = await controller.handle(event);

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ message: 'Player deleted successfully!' });
    expect(mockPlayerService.deletePlayer).toHaveBeenCalledWith('TeamA', 'P1');
  });

  it('should return 400 when DELETE request misses teamId or playerId', async () => {
    const event: ApiGatewayProxyEvent = {
      httpMethod: 'DELETE',
      body: JSON.stringify({ teamId: 'TeamA' }),
    };

    const res = await controller.handle(event);

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body).message).toContain('teamId and playerId are required');
  });

  it('should return 405 for unhandled HTTP methods', async () => {
    const event: ApiGatewayProxyEvent = { httpMethod: 'PUT' };
    const res = await controller.handle(event);

    expect(res.statusCode).toBe(405);
    expect(JSON.parse(res.body).message).toContain('PUT Not Allowed');
  });
});
