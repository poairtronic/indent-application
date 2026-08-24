"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_morph_1 = require("ts-morph");
const service_extractor_1 = require("../src/extractors/service.extractor");
const hook_extractor_1 = require("../src/extractors/hook.extractor");
const quality_analyzer_1 = require("../src/analyzers/quality.analyzer");
describe('Frontend API Scanner Extractors', () => {
    let project;
    beforeEach(() => {
        project = new ts_morph_1.Project({ useInMemoryFileSystem: true });
    });
    it('should extract API services and hook data accurately', () => {
        const serviceFile = project.createSourceFile('src/services/UsersService.ts', `
      import { apiClient } from '../api';
      
      export class UsersService {
        getUsers() {
          return apiClient.get<UserDto[]>('/users');
        }
        createUser(data: CreateUserDto) {
          return apiClient.post<UserDto, CreateUserDto>('/users', data);
        }
      }
    `);
        const hookFile = project.createSourceFile('src/hooks/useUsers.ts', `
      import { useQuery, useMutation } from 'react-query';
      
      export function useUsers() {
        return useQuery(['users'], () => new UsersService().getUsers());
      }
      
      export const useCreateUser = () => {
        return useMutation((data) => new UsersService().createUser(data));
      }
    `);
        const services = (0, service_extractor_1.extractServices)([serviceFile, hookFile]);
        const hooks = (0, hook_extractor_1.extractHooks)([serviceFile, hookFile]);
        expect(services).toHaveLength(2);
        expect(services[0].method).toBe('GET');
        expect(services[0].url).toBe('/users');
        expect(services[0].responseDto).toBe('UserDto[]');
        expect(hooks).toHaveLength(2);
        expect(hooks[0].hookName).toBe('useUsers');
        expect(hooks[0].queryKey).toEqual(["'users'"]);
        const analysis = (0, quality_analyzer_1.analyzeFrontendApis)(services, hooks);
        expect(analysis.endpoints).toHaveLength(2);
        expect(analysis.orphanHooks).toHaveLength(1); // useCreateUser since heuristics look for CreateUserService
        expect(analysis.hardcodedUrls).toHaveLength(2); // '/users' starts with /
    });
});
