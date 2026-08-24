"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const controller_extractor_1 = require("../src/extractors/controller.extractor");
const method_extractor_1 = require("../src/extractors/method.extractor");
describe('API Scanner Extractors', () => {
    let project;
    beforeEach(() => {
        project = new ts_morph_1.Project({ useInMemoryFileSystem: true });
    });
    it('should extract controller path', () => {
        const sourceFile = project.createSourceFile('test.controller.ts', `
      import { Controller } from '@nestjs/common';
      
      @Controller('users')
      export class UsersController {}
    `);
        const classDecl = sourceFile.getClass('UsersController');
        const path = (0, controller_extractor_1.extractControllerPath)(classDecl);
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
        const endpoints = (0, method_extractor_1.extractEndpoints)(classDecl, '/users', 'TestModule');
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
