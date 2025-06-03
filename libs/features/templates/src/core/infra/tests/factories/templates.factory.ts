import { Template } from '@lib/templates/core/domain/entities/template.entity';
import { UuidAdapter } from '@lib/uuid/core/uuid.adapter';
import { faker } from '@faker-js/faker';
import { EntityManager, RequiredEntityData } from '@mikro-orm/core';
import { Factory } from '@mikro-orm/seeder';

export class TemplateFactory extends Factory<Template> {
  model = Template;

  definition(): Partial<Template> {
    return {
      id: new UuidAdapter().generate(),
      name: faker.lorem.word(),
      processCode: faker.lorem.word(),
      metadata: {
        fields: [faker.lorem.word(), faker.lorem.word()],
      },
      outputFormat: faker.lorem.word(),
      isPublic: faker.datatype.boolean(),
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent(),
    };
  }
}

export function useTemplateFactory(data: Partial<RequiredEntityData<Template>>, em: EntityManager): Template {
  return new TemplateFactory(em).makeOne(data);
}

export async function useDbTemplate(data: Partial<RequiredEntityData<Template>>, em: EntityManager): Promise<Template> {
  const template = useTemplateFactory(data, em);
  await em.persistAndFlush(template);
  return template;
}
