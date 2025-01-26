import { Test, TestingModule } from '@nestjs/testing';
import { GroupCommentsService } from './group-comments.service';

describe('GroupCommentsService', () => {
  let service: GroupCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [GroupCommentsService],
    }).compile();

    service = module.get<GroupCommentsService>(GroupCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
