import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Masterminds Backend API',
      version: '1.0.0',
      environment: this.configService.get('NODE_ENV'),
      database: 'Connected', // TODO: Add actual DB health check
      redis: 'Connected', // TODO: Add actual Redis health check
    };
  }
}