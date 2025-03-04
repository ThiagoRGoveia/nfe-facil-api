import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { FileRecord } from '@/core/documents/domain/entities/file-records.entity';
import { PublicFileProcess } from '@/core/documents/domain/entities/public-file-process.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { User } from '@/core/users/domain/entities/user.entity';
import { Webhook } from '@/core/webhooks/domain/entities/webhook.entity';
import { WebhookDelivery } from '@/core/webhooks/domain/entities/webhook-delivery.entity';

export default [User, Template, BatchProcess, FileRecord, PublicFileProcess, Webhook, WebhookDelivery];
