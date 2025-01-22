## Controllers

### Description and Applicability

Controllers are responsible for handling incoming HTTP requests and returning responses to the client. They act as the entry point for HTTP-based interactions and delegate business logic to use cases. Controllers define routes and handle request/response transformations.([1](https://docs.nestjs.com/controllers))

### Code Rules

1. Controllers should be placed in the `presenters/http/controllers` directory
2. File naming convention: `{feature-name}.controller.ts`
3. Class naming convention: PascalCase with Controller suffix (e.g., `ThreadsController`)
4. Must use @Controller() decorator with optional route prefix
5. Should use HTTP method decorators (@Get(), @Post(), etc.)
6. Should delegate business logic to use cases
7. Should handle HTTP-specific concerns (headers, status codes, etc.)
8. Should include proper request/response DTOs and validations
9. Should use appropriate status codes for different operations

### Examples

#### Basic CRUD Controller

```typescript
@Controller('threads')
export class ThreadsController {
  constructor(
    private readonly createThreadUseCase: CreateThreadUseCase,
    private readonly threadDbPort: ThreadDbPort,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createThreadDto: CreateThreadDto) {
    return await this.createThreadUseCase.execute(createThreadDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const thread = await this.threadDbPort.findById(id);
    if (!thread) {
      throw new NotFoundException(`Thread #${id} not found`);
    }
    return thread;
  }
}
```

#### Advanced Request Handling

```typescript
@Controller('threads')
export class ThreadsController {
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() metadata: ThreadFileMetadataDto,
    @Req() request: Request,
  ) {
    return await this.uploadThreadFileUseCase.execute({
      file,
      metadata,
      userId: request.user.id,
    });
  }

  @Get('search')
  async search(
    @Query() query: SearchThreadsDto,
    @Headers('accept-language') lang: string,
  ) {
    return await this.searchThreadsUseCase.execute({
      ...query,
      language: lang,
    });
  }
}
```

### Request Handling Features

1. **Route Parameters**

   ```typescript
   @Get(':id')
   findOne(@Param('id') id: string) {}
   ```

2. **Query Parameters**

   ```typescript
   @Get()
   findAll(@Query() query: ListThreadsDto) {}
   ```

3. **Request Body**

   ```typescript
   @Post()
   create(@Body() createThreadDto: CreateThreadDto) {}
   ```

4. **Headers and Response Configuration**
   ```typescript
   @Post()
   @Header('Cache-Control', 'none')
   @HttpCode(HttpStatus.CREATED)
   create(@Body() createThreadDto: CreateThreadDto) {}
   ```

### Best Practices

1. **Request Validation**

   - Use DTOs with class-validator decorators
   - Implement custom validation pipes when needed
   - Handle validation errors appropriately

2. **Response Handling**

   - Use appropriate HTTP status codes
   - Structure response data consistently
   - Handle errors using exception filters

3. **Route Organization**

   - Group related routes under a common prefix
   - Use sub-resources for nested relationships
   - Keep routes RESTful when possible

4. **Security**
   - Implement authentication guards
   - Use role-based access control
   - Validate and sanitize inputs

### Libraries Used

- @nestjs/common - For controller decorators and HTTP utilities
- class-validator - For request validation
- class-transformer - For request/response transformation
- @nestjs/swagger - For API documentation (optional)

### Error Handling

```typescript
@Controller('threads')
export class ThreadsController {
  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const thread = await this.threadDbPort.findById(id);
      if (!thread) {
        throw new NotFoundException(`Thread #${id} not found`);
      }
      return thread;
    } catch (error) {
      if (error instanceof ThreadNotFoundError) {
        throw new NotFoundException(error.message);
      }
      throw new InternalServerErrorException('Unable to process request');
    }
  }
}
```

### Testing Considerations

1. Use `@nestjs/testing` TestingModule for controller tests
2. Mock dependencies (use cases, ports) in tests
3. Test different response scenarios
4. Verify HTTP status codes and headers
5. Test validation error cases

```typescript
describe('ThreadsController', () => {
  let controller: ThreadsController;
  let createThreadUseCase: CreateThreadUseCase;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ThreadsController],
      providers: [
        {
          provide: CreateThreadUseCase,
          useValue: { execute: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get(ThreadsController);
    createThreadUseCase = module.get(CreateThreadUseCase);
  });

  it('should create thread', async () => {
    const dto = { title: 'Test Thread' };
    await controller.create(dto);
    expect(createThreadUseCase.execute).toHaveBeenCalledWith(dto);
  });
});
```
