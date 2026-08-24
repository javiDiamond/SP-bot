"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exchangeAccountRepository = exports.ExchangeAccountRepository = void 0;
const prisma_client_1 = require("../prisma-client");
class ExchangeAccountRepository {
    async findById(id) {
        return prisma_client_1.prisma.exchangeAccount.findUnique({
            where: { id },
            include: {
                user: true,
                bots: {
                    orderBy: { createdAt: 'desc' },
                    take: 10,
                },
            },
        });
    }
    async findByUserId(userId) {
        return prisma_client_1.prisma.exchangeAccount.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async create(data) {
        return prisma_client_1.prisma.exchangeAccount.create({
            data,
        });
    }
    async update(id, data) {
        return prisma_client_1.prisma.exchangeAccount.update({
            where: { id },
            data,
        });
    }
    async delete(id) {
        await prisma_client_1.prisma.exchangeAccount.delete({
            where: { id },
        });
    }
    async list() {
        return prisma_client_1.prisma.exchangeAccount.findMany({
            include: {
                user: true,
                _count: {
                    select: {
                        bots: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async count() {
        return prisma_client_1.prisma.exchangeAccount.count();
    }
    async countByUserId(userId) {
        return prisma_client_1.prisma.exchangeAccount.count({
            where: { userId },
        });
    }
}
exports.ExchangeAccountRepository = ExchangeAccountRepository;
exports.exchangeAccountRepository = new ExchangeAccountRepository();
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXhjaGFuZ2UtYWNjb3VudC1yZXBvc2l0b3J5LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vc3JjL3JlcG9zaXRvcmllcy9leGNoYW5nZS1hY2NvdW50LXJlcG9zaXRvcnkudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7O0FBQUEsb0RBQTBDO0FBRzFDLE1BQWEseUJBQXlCO0lBQ3BDLEtBQUssQ0FBQyxRQUFRLENBQUMsRUFBVTtRQUN2QixPQUFPLHNCQUFNLENBQUMsZUFBZSxDQUFDLFVBQVUsQ0FBQztZQUN2QyxLQUFLLEVBQUUsRUFBRSxFQUFFLEVBQUU7WUFDYixPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLElBQUk7Z0JBQ1YsSUFBSSxFQUFFO29CQUNKLE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7b0JBQzlCLElBQUksRUFBRSxFQUFFO2lCQUNUO2FBQ0Y7U0FDRixDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLFlBQVksQ0FBQyxNQUFjO1FBQy9CLE9BQU8sc0JBQU0sQ0FBQyxlQUFlLENBQUMsUUFBUSxDQUFDO1lBQ3JDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRTtZQUNqQixPQUFPLEVBQUUsRUFBRSxTQUFTLEVBQUUsTUFBTSxFQUFFO1NBQy9CLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLElBQXVDO1FBQ2xELE9BQU8sc0JBQU0sQ0FBQyxlQUFlLENBQUMsTUFBTSxDQUFDO1lBQ25DLElBQUk7U0FDTCxDQUFDLENBQUM7SUFDTCxDQUFDO0lBRUQsS0FBSyxDQUFDLE1BQU0sQ0FDVixFQUFVLEVBQ1YsSUFBdUM7UUFFdkMsT0FBTyxzQkFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUM7WUFDbkMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFO1lBQ2IsSUFBSTtTQUNMLENBQUMsQ0FBQztJQUNMLENBQUM7SUFFRCxLQUFLLENBQUMsTUFBTSxDQUFDLEVBQVU7UUFDckIsTUFBTSxzQkFBTSxDQUFDLGVBQWUsQ0FBQyxNQUFNLENBQUM7WUFDbEMsS0FBSyxFQUFFLEVBQUUsRUFBRSxFQUFFO1NBQ2QsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJO1FBQ1IsT0FBTyxzQkFBTSxDQUFDLGVBQWUsQ0FBQyxRQUFRLENBQUM7WUFDckMsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxJQUFJO2dCQUNWLE1BQU0sRUFBRTtvQkFDTixNQUFNLEVBQUU7d0JBQ04sSUFBSSxFQUFFLElBQUk7cUJBQ1g7aUJBQ0Y7YUFDRjtZQUNELE9BQU8sRUFBRSxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUU7U0FDL0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztJQUVELEtBQUssQ0FBQyxLQUFLO1FBQ1QsT0FBTyxzQkFBTSxDQUFDLGVBQWUsQ0FBQyxLQUFLLEVBQUUsQ0FBQztJQUN4QyxDQUFDO0lBRUQsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFjO1FBQ2hDLE9BQU8sc0JBQU0sQ0FBQyxlQUFlLENBQUMsS0FBSyxDQUFDO1lBQ2xDLEtBQUssRUFBRSxFQUFFLE1BQU0sRUFBRTtTQUNsQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFsRUQsOERBa0VDO0FBRVksUUFBQSx5QkFBeUIsR0FBRyxJQUFJLHlCQUF5QixFQUFFLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBwcmlzbWEgfSBmcm9tICcuLi9wcmlzbWEtY2xpZW50JztcbmltcG9ydCB0eXBlIHsgRXhjaGFuZ2VBY2NvdW50LCBQcmlzbWEgfSBmcm9tICcuLi8uLi9nZW5lcmF0ZWQnO1xuXG5leHBvcnQgY2xhc3MgRXhjaGFuZ2VBY2NvdW50UmVwb3NpdG9yeSB7XG4gIGFzeW5jIGZpbmRCeUlkKGlkOiBzdHJpbmcpOiBQcm9taXNlPEV4Y2hhbmdlQWNjb3VudCB8IG51bGw+IHtcbiAgICByZXR1cm4gcHJpc21hLmV4Y2hhbmdlQWNjb3VudC5maW5kVW5pcXVlKHtcbiAgICAgIHdoZXJlOiB7IGlkIH0sXG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHVzZXI6IHRydWUsXG4gICAgICAgIGJvdHM6IHtcbiAgICAgICAgICBvcmRlckJ5OiB7IGNyZWF0ZWRBdDogJ2Rlc2MnIH0sXG4gICAgICAgICAgdGFrZTogMTAsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgZmluZEJ5VXNlcklkKHVzZXJJZDogc3RyaW5nKTogUHJvbWlzZTxFeGNoYW5nZUFjY291bnRbXT4ge1xuICAgIHJldHVybiBwcmlzbWEuZXhjaGFuZ2VBY2NvdW50LmZpbmRNYW55KHtcbiAgICAgIHdoZXJlOiB7IHVzZXJJZCB9LFxuICAgICAgb3JkZXJCeTogeyBjcmVhdGVkQXQ6ICdkZXNjJyB9LFxuICAgIH0pO1xuICB9XG5cbiAgYXN5bmMgY3JlYXRlKGRhdGE6IFByaXNtYS5FeGNoYW5nZUFjY291bnRDcmVhdGVJbnB1dCk6IFByb21pc2U8RXhjaGFuZ2VBY2NvdW50PiB7XG4gICAgcmV0dXJuIHByaXNtYS5leGNoYW5nZUFjY291bnQuY3JlYXRlKHtcbiAgICAgIGRhdGEsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyB1cGRhdGUoXG4gICAgaWQ6IHN0cmluZyxcbiAgICBkYXRhOiBQcmlzbWEuRXhjaGFuZ2VBY2NvdW50VXBkYXRlSW5wdXRcbiAgKTogUHJvbWlzZTxFeGNoYW5nZUFjY291bnQ+IHtcbiAgICByZXR1cm4gcHJpc21hLmV4Y2hhbmdlQWNjb3VudC51cGRhdGUoe1xuICAgICAgd2hlcmU6IHsgaWQgfSxcbiAgICAgIGRhdGEsXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBkZWxldGUoaWQ6IHN0cmluZyk6IFByb21pc2U8dm9pZD4ge1xuICAgIGF3YWl0IHByaXNtYS5leGNoYW5nZUFjY291bnQuZGVsZXRlKHtcbiAgICAgIHdoZXJlOiB7IGlkIH0sXG4gICAgfSk7XG4gIH1cblxuICBhc3luYyBsaXN0KCk6IFByb21pc2U8RXhjaGFuZ2VBY2NvdW50W10+IHtcbiAgICByZXR1cm4gcHJpc21hLmV4Y2hhbmdlQWNjb3VudC5maW5kTWFueSh7XG4gICAgICBpbmNsdWRlOiB7XG4gICAgICAgIHVzZXI6IHRydWUsXG4gICAgICAgIF9jb3VudDoge1xuICAgICAgICAgIHNlbGVjdDoge1xuICAgICAgICAgICAgYm90czogdHJ1ZSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIG9yZGVyQnk6IHsgY3JlYXRlZEF0OiAnZGVzYycgfSxcbiAgICB9KTtcbiAgfVxuXG4gIGFzeW5jIGNvdW50KCk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgcmV0dXJuIHByaXNtYS5leGNoYW5nZUFjY291bnQuY291bnQoKTtcbiAgfVxuXG4gIGFzeW5jIGNvdW50QnlVc2VySWQodXNlcklkOiBzdHJpbmcpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIHJldHVybiBwcmlzbWEuZXhjaGFuZ2VBY2NvdW50LmNvdW50KHtcbiAgICAgIHdoZXJlOiB7IHVzZXJJZCB9LFxuICAgIH0pO1xuICB9XG59XG5cbmV4cG9ydCBjb25zdCBleGNoYW5nZUFjY291bnRSZXBvc2l0b3J5ID0gbmV3IEV4Y2hhbmdlQWNjb3VudFJlcG9zaXRvcnkoKTtcbiJdfQ==