import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      name: 'CHRMS API',
      status: 'ok',
      docs: 'See project README for routes',
    };
  }
}
