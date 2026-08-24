import type { User, Prisma } from '../../generated';
export declare class UserRepository {
    findById(id: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: Prisma.UserCreateInput): Promise<User>;
    update(id: string, data: Prisma.UserUpdateInput): Promise<User>;
    delete(id: string): Promise<void>;
    list(): Promise<User[]>;
    count(): Promise<number>;
}
export declare const userRepository: UserRepository;
