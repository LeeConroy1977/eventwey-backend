import { Test, TestingModule } from '@nestjs/testing';
import { EventCommentsController } from './event-comments.controller';

describe('EventCommentsController', () => {
  let controller: EventCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventCommentsController],
    }).compile();

    controller = module.get<EventCommentsController>(EventCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
