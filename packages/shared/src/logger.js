"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const pino_1 = __importDefault(require("pino"));
exports.logger = (0, pino_1.default)({
    level: process.env.LOG_LEVEL || 'info',
    transport: {
        target: 'pino-pretty',
        options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
        },
    },
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibG9nZ2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsibG9nZ2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLGdEQUF3QjtBQUVYLFFBQUEsTUFBTSxHQUFHLElBQUEsY0FBSSxFQUFDO0lBQ3pCLEtBQUssRUFBRSxPQUFPLENBQUMsR0FBRyxDQUFDLFNBQVMsSUFBSSxNQUFNO0lBQ3RDLFNBQVMsRUFBRTtRQUNULE1BQU0sRUFBRSxhQUFhO1FBQ3JCLE9BQU8sRUFBRTtZQUNQLFFBQVEsRUFBRSxJQUFJO1lBQ2QsYUFBYSxFQUFFLGNBQWM7WUFDN0IsTUFBTSxFQUFFLGNBQWM7U0FDdkI7S0FDRjtDQUNGLENBQUMsQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCBwaW5vIGZyb20gJ3Bpbm8nO1xuXG5leHBvcnQgY29uc3QgbG9nZ2VyID0gcGlubyh7XG4gIGxldmVsOiBwcm9jZXNzLmVudi5MT0dfTEVWRUwgfHwgJ2luZm8nLFxuICB0cmFuc3BvcnQ6IHtcbiAgICB0YXJnZXQ6ICdwaW5vLXByZXR0eScsXG4gICAgb3B0aW9uczoge1xuICAgICAgY29sb3JpemU6IHRydWUsXG4gICAgICB0cmFuc2xhdGVUaW1lOiAnU1lTOnN0YW5kYXJkJyxcbiAgICAgIGlnbm9yZTogJ3BpZCxob3N0bmFtZScsXG4gICAgfSxcbiAgfSxcbn0pO1xuIl19