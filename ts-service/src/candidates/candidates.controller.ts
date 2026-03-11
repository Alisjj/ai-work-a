import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { Request } from "express";

import { WorkspaceGuard } from "../auth/guards/workspace.guard";
import { CreateCandidateDto } from "./dto/create-candidate.dto";
import {
  CANDIDATE_REPOSITORY,
  ICandidateRepository,
  CandidateRecord,
} from "../common/repositories/candidate.repository";
import { Inject } from "@nestjs/common";

type AuthedRequest = Request & { workspaceId: string };

@Controller("candidates")
@UseGuards(WorkspaceGuard)
export class CandidatesController {
  constructor(
    @Inject(CANDIDATE_REPOSITORY)
    private readonly candidateRepo: ICandidateRepository,
  ) {}

  @Post()
  async createCandidate(
    @Req() req: AuthedRequest,
    @Body() dto: CreateCandidateDto,
  ): Promise<CandidateRecord> {
    return this.candidateRepo.create({
      workspaceId: req.workspaceId,
      name: dto.name,
      email: dto.email,
    });
  }

  @Get()
  async listCandidates(@Req() req: AuthedRequest): Promise<CandidateRecord[]> {
    return this.candidateRepo.findByWorkspace(req.workspaceId);
  }

  @Get(":id")
  async getCandidate(
    @Req() req: AuthedRequest,
    @Param("id", ParseUUIDPipe) id: string,
  ): Promise<CandidateRecord> {
    const candidate = await this.candidateRepo.findByIdAndWorkspace(
      id,
      req.workspaceId,
    );
    if (!candidate) {
      throw new Error(`Candidate ${id} not found`);
    }
    return candidate;
  }
}
