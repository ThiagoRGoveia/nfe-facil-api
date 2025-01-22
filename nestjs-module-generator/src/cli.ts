#!/usr/bin/env node
import { Command } from 'commander';
import { ModuleGenerator, AVAILABLE_FILE_TYPES, FileType } from './generator';

type PresenterType = 'rest' | 'graphql' | 'all';

const program = new Command();

program.name('nest-module-gen').description('NestJS module generator').version('1.0.0');

program
  .command('generate')
  .description('Generate a new module or specific file')
  .argument('<feature-name>', 'Name of the feature module (in kebab-case)')
  .option('-p, --path <path>', 'Base path of the project', process.cwd())
  .option(
    '-t, --type <type>',
    `Type of file to generate. If not specified, generates entire module. Available types: ${AVAILABLE_FILE_TYPES.join(
      ', ',
    )}`,
  )
  .option('-o, --output <output>', 'Custom output path for the generated file')
  .option(
    '--operation <operation>',
    'Operation type for use cases (create/update). Required when type is use-case or use-case-test',
  )
  .option('-u, --use-case <names...>', 'Names of use cases to generate (can specify multiple)')
  .option('--presenter <type>', 'Type of presenter to generate (rest, graphql, all)', 'all' as PresenterType)
  .action(
    (
      featureName: string,
      options: {
        path: string;
        type?: FileType;
        output?: string;
        operation?: string;
        useCase?: string[];
        presenter: PresenterType;
      },
    ) => {
      try {
        // Validate presenter type
        if (!['rest', 'graphql', 'all'].includes(options.presenter)) {
          throw new Error('Invalid presenter type. Valid values: rest, graphql, all');
        }

        const generator = new ModuleGenerator(options.path, featureName);

        if (options.type) {
          // Skip presenter validation for individual file generation
          // Validate operation for use cases
          if ((options.type === 'use-case' || options.type === 'use-case-test') && !options.operation) {
            throw new Error(
              'Operation (--operation) is required for use case generation. Valid values: create, update',
            );
          }

          if (options.operation && !['create', 'update'].includes(options.operation)) {
            throw new Error('Invalid operation. Valid values: create, update');
          }

          // Generate specific file
          generator.generateFile(options.type, options.output, options.operation);
          console.log(
            `✅ Successfully generated ${options.type} file${options.operation ? ` (${options.operation})` : ''}${
              options.output ? ` at: ${options.output}` : ''
            }`,
          );
        } else {
          // Generate entire module
          generator.generate(options.presenter);

          // Generate additional use cases if specified
          if (options.useCase && options.useCase.length > 0) {
            for (const useCaseName of options.useCase) {
              generator.generateFile('use-case', undefined, useCaseName);
              console.log(`✅ Successfully generated use case: ${useCaseName}`);
            }
          }

          console.log(`✅ Successfully generated module: ${featureName}`);
        }
      } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
      }
    },
  );

program.parse();
