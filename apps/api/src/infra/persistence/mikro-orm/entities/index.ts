import { BatchProcess } from '@/core/documents/domain/entities/batch-process.entity';
import { FileToProcess } from '@/core/documents/domain/entities/file-process.entity';
import { Template } from '@/core/templates/domain/entities/template.entity';
import { User } from '@/core/users/domain/entities/user.entity';

export default [User, Template, BatchProcess, FileToProcess];
