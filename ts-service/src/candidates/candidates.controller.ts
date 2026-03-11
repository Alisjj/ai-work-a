import {
  Body,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from "@nestjs/common";

import { AuthUser } from "../auth/auth-user.decorator";
import { AuthUser as AuthUserType } from "../auth/auth.types";
import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import {
  CANDIDATE_REPOSITORY,
  ICandidateRepository,
  CandidateRecord,
} from "../common/repositories/candidate.repository";

@Controller("candidates")
@UseGuards(WorkspaceGuard)
export class CandidatesController {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
  ) { }

  @Post()
  async createCandidate(
    @AuthUser() user: AuthUserType,
    @Body() dto: CreateCandidateDto,
  ): Promise<CandidateRecord> {
    return this.candidateRepo.create({
      workspaceId: user.workspaceId,
      name: dto.name,
      email: dto.email,
    });
  }

  @Get()
  async listCandidates(
    @AuthUser() user: AuthUserType,
  ): Promise<CandidateRecord[]> {
    return this.candidateRepo.findByWorkspace(user.workspaceId);
  }

  @Get(":id")
  async getCandidate(
    @AuthUser() user: AuthUserType,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<CandidateRecord> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(
      id,
      user.workspaceId,
    );
    if (!candidate) {
      throw new NotFoundException(`Candidate ${id} not found`);
    }
    return candidate;
  }
}
