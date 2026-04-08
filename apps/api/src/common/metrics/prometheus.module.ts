import { Module, OnModuleInit } from '@nestjs/common';
import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import * as client from 'prom-client';

const register = new client.Registry();

client.collectDefaultMetrics({ register });

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [register],
});

export const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

@Controller()
class MetricsController {
  @Get('metrics')
  async getMetrics(@Res() res: Response) {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
  }
}

@Module({
  controllers: [MetricsController],
})
export class PrometheusModule implements OnModuleInit {
  onModuleInit() {
    register.setDefaultLabels({ service: 'api' });
  }
}
