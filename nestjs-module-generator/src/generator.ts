import * as fs from 'fs';
import * as path from 'path';
import Mustache from 'mustache';
import { CaseTransformer } from './utils/case-transformer';

export const AVAILABLE_FILE_TYPES = [
  'module',
  'entity',
  'resolver',
  'resolver-test',
  'db-port',
  'repository',
  'repository-test',
  'repository-it-test',
  'create-dto',
  'update-dto',
  'use-case',
  'use-case-test',
  'factory',
  'controller',
  'controller-test',
] as const;

export type FileType = (typeof AVAILABLE_FILE_TYPES)[number];

interface FileTemplate {
  template: string;
  outputPattern: string;
}

const FILE_TEMPLATES: Record<FileType, FileTemplate> = {
  module: {
    template: 'module.mustache',
    outputPattern: '{featureKebab}.module.ts',
  },
  entity: {
    template: 'entity.mustache',
    outputPattern: 'domain/entities/{singularKebab}.entity.ts',
  },
  resolver: {
    template: 'resolver.mustache',
    outputPattern: 'presenters/graphql/resolvers/{featureKebab}.resolver.ts',
  },
  'resolver-test': {
    template: 'resolver.it.test.mustache',
    outputPattern: 'presenters/graphql/resolvers/tests/{featureKebab}.resolver.it.test.ts',
  },
  'db-port': {
    template: 'db-port.mustache',
    outputPattern: 'application/ports/{featureKebab}-db.port.ts',
  },
  repository: {
    template: 'repository.mustache',
    outputPattern: 'infra/persistence/db/orm/{featureKebab}-mikro-orm-db.repository.ts',
  },
  'repository-test': {
    template: 'repository.spec.mustache',
    outputPattern: 'infra/persistence/db/orm/tests/{featureKebab}-mikro-orm-db.repository.spec.ts',
  },
  'repository-it-test': {
    template: 'repository.it.test.mustache',
    outputPattern: 'infra/persistence/db/orm/tests/{featureKebab}-mikro-orm-db.repository.it.test.ts',
  },
  'create-dto': {
    template: 'create-dto.mustache',
    outputPattern: 'application/dtos/create-{singularKebab}.dto.ts',
  },
  'update-dto': {
    template: 'update-dto.mustache',
    outputPattern: 'application/dtos/update-{singularKebab}.dto.ts',
  },
  'use-case': {
    template: 'use-case.mustache',
    outputPattern: 'application/use-cases/{operation}-{singularKebab}.use-case.ts',
  },
  'use-case-test': {
    template: 'use-case.spec.mustache',
    outputPattern: 'application/use-cases/tests/{operation}-{singularKebab}.use-case.spec.ts',
  },
  factory: {
    template: 'factory.mustache',
    outputPattern: 'infra/tests/factories/{featureKebab}.factory.ts',
  },
  controller: {
    template: 'controller.mustache',
    outputPattern: 'presenters/rest/controllers/{featureKebab}.controller.ts',
  },
  'controller-test': {
    template: 'controller.spec.mustache',
    outputPattern: 'presenters/rest/controllers/tests/{featureKebab}.controller.spec.ts',
  },
};

export class ModuleGenerator {
  private readonly basePath: string;
  private readonly featureName: string;
  private readonly templatePath: string;

  constructor(basePath: string, featureName: string) {
    this.basePath = basePath;
    this.featureName = CaseTransformer.toKebabCase(featureName);
    this.templatePath = path.join(__dirname, 'templates');
  }

  private get moduleData() {
    const singular = CaseTransformer.singularize(this.featureName);
    return {
      featureKebab: this.featureName,
      featurePascal: CaseTransformer.toPascalCase(this.featureName),
      featureCamel: CaseTransformer.toCamelCase(this.featureName),
      featureSnake: CaseTransformer.toSnakeCase(this.featureName),
      featureUpperSnake: CaseTransformer.toUpperSnakeCase(this.featureName),
      singularKebab: singular,
      singularPascal: CaseTransformer.toPascalCase(singular),
      singularCamel: CaseTransformer.toCamelCase(singular),
      singularSnake: CaseTransformer.toSnakeCase(singular),
      singularUpperSnake: CaseTransformer.toUpperSnakeCase(singular),
      pluralKebab: CaseTransformer.toKebabCase(CaseTransformer.pluralize(singular)),
      pluralPascal: CaseTransformer.toPascalCase(CaseTransformer.pluralize(singular)),
      pluralCamel: CaseTransformer.toCamelCase(CaseTransformer.pluralize(singular)),
      pluralSnake: CaseTransformer.toSnakeCase(CaseTransformer.pluralize(singular)),
      pluralUpperSnake: CaseTransformer.toUpperSnakeCase(CaseTransformer.pluralize(singular)),
    };
  }

  private ensureDirectoryExists(dirPath: string): void {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  private renderTemplate(templateName: string, data: any): string {
    const templatePath = path.join(this.templatePath, templateName);
    const template = fs.readFileSync(templatePath, 'utf-8');
    return Mustache.render(template, data);
  }

  private writeFile(filePath: string, content: string): void {
    const dir = path.dirname(filePath);
    this.ensureDirectoryExists(dir);
    fs.writeFileSync(filePath, content);
  }

  public generateFile(type: FileType, customOutputPath?: string, operation?: string): void {
    const template = FILE_TEMPLATES[type];
    if (!template) {
      throw new Error(`Invalid file type. Available types: ${AVAILABLE_FILE_TYPES.join(', ')}`);
    }

    const data = {
      ...this.moduleData,
      operation,
      isCreate: operation === 'create',
      isUpdate: operation === 'update',
    };

    const renderedContent = this.renderTemplate(template.template, data);
    let outputPath = customOutputPath || path.join(this.basePath, 'src/core', this.featureName, template.outputPattern);

    outputPath = outputPath
      .replace(/{featureKebab}/g, data.featureKebab)
      .replace(/{singularKebab}/g, data.singularKebab)
      .replace(/{operation}/g, operation || '');

    const outputDir = path.dirname(outputPath);
    this.ensureDirectoryExists(outputDir);
    this.writeFile(outputPath, renderedContent);
  }

  public generate(presenterType: 'rest' | 'graphql' | 'all' = 'rest'): void {
    const modulePath = path.join(this.basePath, 'src/core', this.featureName);

    // Create base module structure
    const directories = [
      'application/dtos',
      'application/ports',
      'application/use-cases',
      'application/use-cases/tests',
      'domain/constants',
      'domain/entities',
      'domain/types',
      'domain/value-objects',
      'infra/adapters/tests',
      'infra/persistence/db/orm/tests',
    ];

    // Add presenter directories based on type
    if (presenterType === 'rest' || presenterType === 'all') {
      directories.push('presenters/rest/controllers', 'presenters/rest/controllers/tests', 'presenters/rest/dtos');
    }

    if (presenterType === 'graphql' || presenterType === 'all') {
      directories.push('presenters/graphql/dtos', 'presenters/graphql/resolvers', 'presenters/graphql/resolvers/tests');
    }

    directories.forEach((dir) => {
      this.ensureDirectoryExists(path.join(modulePath, dir));
    });

    // Generate all files
    Object.keys(FILE_TEMPLATES).forEach((type) => {
      const fileType = type as FileType;

      // Skip presenter files based on type
      if (fileType.includes('resolver') && presenterType === 'rest') {
        return;
      }
      if (fileType.includes('controller') && presenterType === 'graphql') {
        return;
      }

      if (fileType === 'use-case' || fileType === 'use-case-test') {
        this.generateFile(fileType, undefined, 'create');
        this.generateFile(fileType, undefined, 'update');
        this.generateFile(fileType, undefined, 'delete');
      } else {
        this.generateFile(fileType);
      }
    });
  }
}
