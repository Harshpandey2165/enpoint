import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from '../tasks/entities/task.entity';

@Controller('health')
export class HealthController {
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async checkHealth() {
    try {
      // Check database connection by performing a simple query
      const taskCount = await this.tasksRepository.count();
      
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
          status: 'ok',
          taskCount,
        },
        api: {
          status: 'ok',
          version: '1.0.0',
        },
      };
    } catch (error) {
      return {
        status: 'error',
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }
}
