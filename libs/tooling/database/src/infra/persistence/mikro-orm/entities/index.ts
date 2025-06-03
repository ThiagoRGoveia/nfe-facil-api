import { User } from '@lib/users/core/domain/entities/user.entity';
import { BatchProcess } from '@lib/documents/core/domain/entities/batch-process.entity';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { FileRecord } from '@lib/documents/core/domain/entities/file-records.entity';
import { PublicFileProcess } from '@lib/documents/core/domain/entities/public-file-process.entity';
import { Webhook } from '@lib/webhooks/core/domain/entities/webhook.entity';
import { WebhookDelivery } from '@lib/webhooks/core/domain/entities/webhook-delivery.entity';
import { CreditTransaction } from '@lib/user-credits/core/domain/entities/credit-transaction.entity';
import { CreditSubscription } from '@lib/user-credits/core/domain/entities/credit-subscription.entity';

export default [
  User,
  Template,
  BatchProcess,
  FileRecord,
  PublicFileProcess,
  Webhook,
  WebhookDelivery,
  CreditTransaction,
  CreditSubscription,
];
