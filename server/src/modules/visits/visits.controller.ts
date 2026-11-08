import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateVisitDto } from './dto/create-visit.dto.js';
import { PersonIdParamDto } from './dto/person-id-param.dto.js';
import { VisitHistoryQueryDto } from './dto/visit-history-query.dto.js';
import { VisitsService } from './visits.service.js';

@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Post()
  async create(@Body() createVisitDto: CreateVisitDto) {
    return {
      data: await this.visitsService.create(createVisitDto),
    };
  }

  @Get(':personId')
  async findByPerson(
    @Param() params: PersonIdParamDto,
    @Query() query: VisitHistoryQueryDto,
  ) {
    return {
      data: await this.visitsService.findByPerson(
        params.personId,
        query.limit,
      ),
    };
  }
}
