import { Template } from '../../domain/entities/template.entity';
import { BaseDbPort } from '@/infra/ports/_base-db-port';

export abstract class TemplateDbPort extends BaseDbPort<Template> {}
