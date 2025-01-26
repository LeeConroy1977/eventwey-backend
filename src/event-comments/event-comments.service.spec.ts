import { Test, TestingModule } from '@nestjs/testing';
import { EventCommentsService } from './event-comments.service';

describe('EventCommentsService', () => {
  let service: EventCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventCommentsService],
    }).compile();

    service = module.get<EventCommentsService>(EventCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
