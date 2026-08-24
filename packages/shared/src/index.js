"use strict";
// Shared utilities, types, and constants for Wallex Grid Bot
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.decryptApiKey = exports.encryptApiKey = exports.generateClientOrderId = exports.GridMath = exports.DecimalUtils = void 0;
__exportStar(require("./types"), exports);
__exportStar(require("./zod-schemas"), exports);
__exportStar(require("./constants"), exports);
var decimal_utils_1 = require("./decimal-utils");
Object.defineProperty(exports, "DecimalUtils", { enumerable: true, get: function () { return decimal_utils_1.DecimalUtils; } });
var grid_math_1 = require("./grid-math");
Object.defineProperty(exports, "GridMath", { enumerable: true, get: function () { return grid_math_1.GridMath; } });
var order_id_generator_1 = require("./order-id-generator");
Object.defineProperty(exports, "generateClientOrderId", { enumerable: true, get: function () { return order_id_generator_1.generateClientOrderId; } });
var encryption_1 = require("./encryption");
Object.defineProperty(exports, "encryptApiKey", { enumerable: true, get: function () { return encryption_1.encryptApiKey; } });
Object.defineProperty(exports, "decryptApiKey", { enumerable: true, get: function () { return encryption_1.decryptApiKey; } });
var logger_1 = require("./logger");
Object.defineProperty(exports, "logger", { enumerable: true, get: function () { return logger_1.logger; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEsNkRBQTZEOzs7Ozs7Ozs7Ozs7Ozs7OztBQUU3RCwwQ0FBd0I7QUFDeEIsZ0RBQThCO0FBQzlCLDhDQUE0QjtBQUM1QixpREFBK0M7QUFBdEMsNkdBQUEsWUFBWSxPQUFBO0FBQ3JCLHlDQUF1QztBQUE5QixxR0FBQSxRQUFRLE9BQUE7QUFDakIsMkRBQTZEO0FBQXBELDJIQUFBLHFCQUFxQixPQUFBO0FBQzlCLDJDQUE0RDtBQUFuRCwyR0FBQSxhQUFhLE9BQUE7QUFBRSwyR0FBQSxhQUFhLE9BQUE7QUFDckMsbUNBQWtDO0FBQXpCLGdHQUFBLE1BQU0sT0FBQSIsInNvdXJjZXNDb250ZW50IjpbIi8vIFNoYXJlZCB1dGlsaXRpZXMsIHR5cGVzLCBhbmQgY29uc3RhbnRzIGZvciBXYWxsZXggR3JpZCBCb3RcblxuZXhwb3J0ICogZnJvbSAnLi90eXBlcyc7XG5leHBvcnQgKiBmcm9tICcuL3pvZC1zY2hlbWFzJztcbmV4cG9ydCAqIGZyb20gJy4vY29uc3RhbnRzJztcbmV4cG9ydCB7IERlY2ltYWxVdGlscyB9IGZyb20gJy4vZGVjaW1hbC11dGlscyc7XG5leHBvcnQgeyBHcmlkTWF0aCB9IGZyb20gJy4vZ3JpZC1tYXRoJztcbmV4cG9ydCB7IGdlbmVyYXRlQ2xpZW50T3JkZXJJZCB9IGZyb20gJy4vb3JkZXItaWQtZ2VuZXJhdG9yJztcbmV4cG9ydCB7IGVuY3J5cHRBcGlLZXksIGRlY3J5cHRBcGlLZXkgfSBmcm9tICcuL2VuY3J5cHRpb24nO1xuZXhwb3J0IHsgbG9nZ2VyIH0gZnJvbSAnLi9sb2dnZXInO1xuIl19