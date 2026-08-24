"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRepository = exports.UserRepository = void 0;
const prisma_client_1 = require("../prisma-client");
class UserRepository {
    async findById(id) {
        return prisma_client_1.prisma.user.findUnique({
            where: { id },
            include: {
                exchangeAccounts: true,
                bots: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }
    async findByEmail(email) {
        return prisma_client_1.prisma.user.findUnique({
            where: { email },
            include: {
                exchangeAccounts: true,
            },
        });
    }
    async create(data) {
        return prisma_client_1.prisma.user.create({
            data,
        });
    }
    async update(id, data) {
        return prisma_client_1.prisma.user.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await prisma_client_1.prisma.user.delete({
            where: { id },
        });
    }
    async list() {
        return prisma_client_1.prisma.user.findMany({
            include: {
                _count: {
                    select: {
                        exchangeAccounts: true,
                        bots: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async count() {
        return prisma_client_1.prisma.user.count();
    }
}
exports.UserRepository = UserRepository;
exports.userRepository = new UserRepository();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXNlci1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JlcG9zaXRvcmllcy91c2VyLXJlcG9zaXRvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0RBQTBDO0FBRzFDLE1BQWEsY0FBYztJQUN6QixLQUFLLENBQUMsUUFBUSxDQUFDLEVBQVU7UUFDdkIsT0FBTyxzQkFBTSxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUM7WUFDNUIsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ2IsT0FBTyxFQUFFO2dCQUNQLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLElBQUksRUFBRTtvQkFDSixPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO29CQUM5QixJQUFJLEVBQUUsRUFBRTtpQkFDVDthQUNGO1NBQ0YsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxXQUFXLENBQUMsS0FBYTtRQUM3QixPQUFPLHNCQUFNLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQztZQUM1QixLQUFLLEVBQUUsRUFBRSxLQUFLLEVBQUU7WUFDaEIsT0FBTyxFQUFFO2dCQUNQLGdCQUFnQixFQUFFLElBQUk7YUFDdkI7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxJQUE0QjtRQUN2QyxPQUFPLHNCQUFNLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQztZQUN4QixJQUFJO1NBQ0wsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxNQUFNLENBQUMsRUFBVSxFQUFFLElBQTRCO1FBQ25ELE9BQU8sc0JBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3hCLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtZQUNiLElBQUk7U0FDTCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FBQyxFQUFVO1FBQ3JCLE1BQU0sc0JBQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDO1lBQ3ZCLEtBQUssRUFBRSxFQUFFLEVBQUUsRUFBRTtTQUNkLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsSUFBSTtRQUNSLE9BQU8sc0JBQU0sQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBQzFCLE9BQU8sRUFBRTtnQkFDUCxNQUFNLEVBQUU7b0JBQ04sTUFBTSxFQUFFO3dCQUNOLGdCQUFnQixFQUFFLElBQUk7d0JBQ3RCLElBQUksRUFBRSxJQUFJO3FCQUNYO2lCQUNGO2FBQ0Y7WUFDRCxPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsS0FBSztRQUNULE9BQU8sc0JBQU0sQ0FBQyxJQUFJLENBQUMsS0FBSyxFQUFFLENBQUM7SUFDN0IsQ0FBQztDQUNGO0FBM0RELHdDQTJEQztBQUVZLFFBQUEsY0FBYyxHQUFHLElBQUksY0FBYyxFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcmlzbWEgfSBmcm9tICcuLi9wcmlzbWEtY2xpZW50JztcbmltcG9ydCB0eXBlIHsgVXNlciwgUHJpc21hIH0gZnJvbSAnLi4vLi4vZ2VuZXJhdGVkJztcblxuZXhwb3J0IGNsYXNzIFVzZXJSZXBvc2l0b3J5IHtcbiAgYXN5bmMgZmluZEJ5SWQoaWQ6IHN0cmluZyk6IFByb21pc2U8VXNlciB8IG51bGw+IHtcbiAgICByZXR1cm4gcHJpc21hLnVzZXIuZmluZFVuaXF1ZSh7XG4gICAgICB3aGVyZTogeyBpZCB9LFxuICAgICAgaW5jbHVkZToge1xuICAgICAgICBleGNoYW5nZUFjY291bnRzOiB0cnVlLFxuICAgICAgICBib3RzOiB7XG4gICAgICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6ICdkZXNjJyB9LFxuICAgICAgICAgIHRha2U6IDEwLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGZpbmRCeUVtYWlsKGVtYWlsOiBzdHJpbmcpOiBQcm9taXNlPFVzZXIgfCBudWxsPiB7XG4gICAgcmV0dXJuIHByaXNtYS51c2VyLmZpbmRVbmlxdWUoe1xuICAgICAgd2hlcmU6IHsgZW1haWwgfSxcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgZXhjaGFuZ2VBY2NvdW50czogdHJ1ZSxcbiAgICAgIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBjcmVhdGUoZGF0YTogUHJpc21hLlVzZXJDcmVhdGVJbnB1dCk6IFByb21pc2U8VXNlcj4ge1xuICAgIHJldHVybiBwcmlzbWEudXNlci5jcmVhdGUoe1xuICAgICAgZGF0YSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIHVwZGF0ZShpZDogc3RyaW5nLCBkYXRhOiBQcmlzbWEuVXNlclVwZGF0ZUlucHV0KTogUHJvbWlzZTxVc2VyPiB7XG4gICAgcmV0dXJuIHByaXNtYS51c2VyLnVwZGF0ZSh7XG4gICAgICB3aGVyZTogeyBpZCB9LFxuICAgICAgZGF0YSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGRlbGV0ZShpZDogc3RyaW5nKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgYXdhaXQgcHJpc21hLnVzZXIuZGVsZXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBsaXN0KCk6IFByb21pc2U8VXNlcltdPiB7XG4gICAgcmV0dXJuIHByaXNtYS51c2VyLmZpbmRNYW55KHtcbiAgICAgIGluY2x1ZGU6IHtcbiAgICAgICAgX2NvdW50OiB7XG4gICAgICAgICAgc2VsZWN0OiB7XG4gICAgICAgICAgICBleGNoYW5nZUFjY291bnRzOiB0cnVlLFxuICAgICAgICAgICAgYm90czogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAnZGVzYycgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHByaXNtYS51c2VyLmNvdW50KCk7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IHVzZXJSZXBvc2l0b3J5ID0gbmV3IFVzZXJSZXBvc2l0b3J5KCk7XG4iXX0=