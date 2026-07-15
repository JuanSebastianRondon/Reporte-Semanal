import {Controller, Get, Post} from '@nestjs/common';
import {StatusService} from './status.service';

@Controller()
export class StatusController {
    constructor(
        private readonly statusService: StatusService
    ) {}

    @Get('status')
    async getStatus() {
        return await this.statusService.getStatus();
    }

    @Post('report/generate')
    async generateReport(){
        await this.statusService.generateReportNow();
        return {ok: true};
    }

    @Post('app/quit')
    async quit(){
        setImmediate(() => 
            this.statusService.shutdown()
        );
        return {ok: true};
    }
    @Get('app/data-folder')
    getDataFolderPath() {
        return this.statusService.getDataFolderPath();
    }

}