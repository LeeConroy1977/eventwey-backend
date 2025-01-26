import { Test, TestingModule } from '@nestjs/testing';
import { GroupCommentsController } from './group-comments.controller';

describe('GroupCommentsController', () => {
  let controller: GroupCommentsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GroupCommentsController],
    }).compile();

    controller = module.get<GroupCommentsController>(GroupCommentsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
