import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  create() {
    return this.prisma.user.create({
      data: {
        email: 'test@gmail.com',
        password: '123456',
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }
}
