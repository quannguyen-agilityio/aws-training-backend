import { describe, it, expect, beforeEach } from 'vitest';
import { mockClient } from 'aws-sdk-client-mock';
import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { PlayerRepository } from './player.repository';
import { Player } from '@shared/types';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('PlayerRepository Unit Tests', () => {
  let repository: PlayerRepository;

  beforeEach(() => {
    ddbMock.reset();
    repository = new PlayerRepository(ddbMock as unknown as DynamoDBDocumentClient, 'TestTable');
  });

  it('should find all players via ScanCommand', async () => {
    const mockPlayers: Player[] = [
      { teamId: 'TeamA', playerId: 'P1', name: 'John', email: 'john@example.com' },
      { teamId: 'TeamA', playerId: 'P2', name: 'Jane', email: 'jane@example.com' },
    ];
    ddbMock.on(ScanCommand).resolves({ Items: mockPlayers });

    const result = await repository.findAll();

    expect(result).toEqual(mockPlayers);
    expect(ddbMock.calls()).toHaveLength(1);
  });

  it('should find a player by key via GetCommand', async () => {
    const mockPlayer: Player = {
      teamId: 'TeamA',
      playerId: 'P1',
      name: 'John',
      email: 'john@example.com',
    };
    ddbMock.on(GetCommand).resolves({ Item: mockPlayer });

    const result = await repository.findByKey('TeamA', 'P1');

    expect(result).toEqual(mockPlayer);
  });

  it('should return null if player is not found by key', async () => {
    ddbMock.on(GetCommand).resolves({ Item: undefined });

    const result = await repository.findByKey('TeamA', 'P99');

    expect(result).toBeNull();
  });

  it('should save a player via PutCommand', async () => {
    const playerToSave: Player = {
      teamId: 'TeamB',
      playerId: 'P3',
      name: 'Alex',
      email: 'alex@example.com',
    };
    ddbMock.on(PutCommand).resolves({});

    const result = await repository.save(playerToSave);

    expect(result).toEqual(playerToSave);
  });

  it('should delete a player via DeleteCommand', async () => {
    ddbMock.on(DeleteCommand).resolves({});

    await repository.delete('TeamA', 'P1');

    expect(ddbMock.calls()).toHaveLength(1);
  });
});
