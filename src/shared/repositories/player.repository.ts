import {
  DynamoDBDocumentClient,
  ScanCommand,
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient as defaultDocClient } from '@shared/clients/dynamodb.client';
import { config } from '@config/environment';
import { Player } from '@shared/types';

export class PlayerRepository {
  private readonly client: DynamoDBDocumentClient;
  private readonly tableName: string;

  constructor(
    client: DynamoDBDocumentClient = defaultDocClient,
    tableName: string = config.tableName
  ) {
    this.client = client;
    this.tableName = tableName;
  }

  async findAll(): Promise<Player[]> {
    const command = new ScanCommand({ TableName: this.tableName });
    const result = await this.client.send(command);
    return (result.Items as Player[]) || [];
  }

  async findByKey(teamId: string, playerId: string): Promise<Player | null> {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { teamId, playerId },
    });
    const result = await this.client.send(command);
    return (result.Item as Player) || null;
  }

  async save(player: Player): Promise<Player> {
    const command = new PutCommand({
      TableName: this.tableName,
      Item: player,
    });
    await this.client.send(command);
    return player;
  }

  async delete(teamId: string, playerId: string): Promise<void> {
    const command = new DeleteCommand({
      TableName: this.tableName,
      Key: { teamId, playerId },
    });
    await this.client.send(command);
  }
}
