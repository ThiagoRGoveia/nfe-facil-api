import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@/infra/persistence/mikro-orm/repositories/_base-mikro-orm-db.repository';
import { TemplateDbPort } from '@/core/templates/application/ports/templates-db.port';
import { Template } from '@/core/templates/domain/entities/template.entity';

@Injectable()
export class TemplateMikroOrmDbRepository extends EntityRepository(Template) implements TemplateDbPort {}
