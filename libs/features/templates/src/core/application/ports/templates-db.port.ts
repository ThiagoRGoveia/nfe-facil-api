import { Template } from '../../domain/entities/template.entity';
import { BaseDbPort } from '@lib/commons/core/ports/_base-db-port';

export abstract class TemplateDbPort extends BaseDbPort<Template> {}
