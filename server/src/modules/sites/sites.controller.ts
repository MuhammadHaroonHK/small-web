import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';
import { CreateSiteDto } from './dto/create-site.dto.js';
import { SitesService } from './sites.service.js';

@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  async findAll() {
    return {
      data: await this.sitesService.findAll(),
    };
  }

  @Get(':address')
  async findOne(@Param('address') address: string) {
    return {
      data: await this.sitesService.findOne(address),
    };
  }

  @Post()
  async create(@Body() createSiteDto: CreateSiteDto) {
    return {
      data: await this.sitesService.create(createSiteDto),
    };
  }
}
