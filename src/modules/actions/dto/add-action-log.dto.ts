import { ActionType } from 'prisma/generated/enums';

export class AddActionLogDto {
  type: ActionType;
  transactionId: string;
}
