import { Injectable } from '@nestjs/common';
import { EntityRepository } from '@lib/database/infra/persistence/repositories/_base-mikro-orm-db.repository';
import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { TemplateDbPort } from '@lib/templates/core/application/ports/templates-db.port';

@Injectable()
export class TemplateMikroOrmDbRepository extends EntityRepository(Template) implements TemplateDbPort {}
