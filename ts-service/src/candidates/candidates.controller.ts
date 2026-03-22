import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthUser } from "../auth/auth-user.decorator";
import { AuthUser as AuthUserType } from "../auth/auth.types";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import { CandidateRecord } from "./candidates.types";
import { CandidatesService } from "./candidates.service";

@Controller("candidates")
@UseGuards(WorkspaceGuard)
export class CandidatesController {
  constructor(private readonly candidatesService: CandidatesService) {}

  @Post()
  async createCandidate(
    @AuthUser() user: AuthUserType,
    @Body() dto: CreateCandidateDto,
  ): Promise<CandidateRecord> {
    return this.candidatesService.createCandidate(user.workspaceId, dto.name, dto.email);
  }

  @Get()
  async listCandidates(
    @AuthUser() user: AuthUserType,
  ): Promise<CandidateRecord[]> {
    return this.candidatesService.listCandidates(user.workspaceId);
  }

  @Get(":id")
  async getCandidate(
    @AuthUser() user: AuthUserType,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<CandidateRecord> {
    return this.candidatesService.getCandidate(user.workspaceId, id);
  }
}
