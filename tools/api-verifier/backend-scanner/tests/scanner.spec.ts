import { Project } from 'ts-morph';
import { extractControllerPath, extractModuleName } from '../src/extractors/controller.extractor';
import { extractEndpoints } from '../src/extractors/method.extractor';

describe('API Scanner Extractors', () => {
  let project: Project;

  beforeEach(() => {
    project = new Project({ useInMemoryFileSystem: true });
  });

  it('should extract controller path', () => {
    const sourceFile = project.createSourceFile('test.controller.ts', `
      import { Controller } from '@nestjs/common';
      
      @Controller('users')
      export class UsersController {}
    `);

    const classDecl = sourceFile.getClass('UsersController');
    const path = extractControllerPath(classDecl!);
    expect(path).toBe('/users');
  });

  it('should extract endpoints with HTTP methods and DTOs', () => {
    const sourceFile = project.createSourceFile('test.controller.ts', `
      import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
      import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';

      @ApiTags('Users')
      @Controller('users')
      export class UsersController {
        
        @Get(':id')
        @ApiOperation({ summary: 'Get a user' })
        @ApiResponse({ status: 200, type: 'UserDto' })
        getUser(@Param('id') id: string): string {
          return 'user';
        }

        @Post()
        @UseGuards(JwtAuthGuard)
        @Roles('admin')
        createUser(@Body() body: CreateUserDto): string {
          return 'created';
        }
      }
    `);

    const classDecl = sourceFile.getClass('UsersController');
    const endpoints = extractEndpoints(classDecl!, '/users', 'TestModule');

    expect(endpoints).toHaveLength(2);
    
    expect(endpoints[0].method).toBe('GET');
    expect(endpoints[0].path).toBe('/:id');
    expect(endpoints[0].fullPath).toBe('/users/:id');
    expect(endpoints[0].swagger.summary).toBe('Get a user');
    expect(endpoints[0].swagger.responses[0].status).toBe(200);

    expect(endpoints[1].method).toBe('POST');
    expect(endpoints[1].guards).toContain('JwtAuthGuard');
    expect(endpoints[1].roles).toContain('admin');
    expect(endpoints[1].dto).toBe('CreateUserDto');
  });
});
