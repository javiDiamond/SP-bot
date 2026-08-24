"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GridMath = void 0;
const decimal_js_1 = __importDefault(require("decimal.js"));
const types_1 = require("./types");
class GridMath {
    /**
     * Generate grid levels based on configuration
     */
    static generateGridLevels(config, pricePrecision) {
        const levels = [];
        const lowerPrice = new decimal_js_1.default(config.lowerPrice);
        const upperPrice = new decimal_js_1.default(config.upperPrice);
        const gridCount = config.gridCount;
        if (gridCount < 2) {
            throw new Error('Grid count must be at least 2');
        }
        if (lowerPrice.gte(upperPrice)) {
            throw new Error('Lower price must be less than upper price');
        }
        for (let i = 0; i <= gridCount; i++) {
            let price;
            if (config.gridType === types_1.GridType.ARITHMETIC) {
                // Arithmetic grid: equal price spacing
                const step = upperPrice.minus(lowerPrice).div(gridCount);
                price = lowerPrice.plus(step.times(i));
            }
            else {
                // Geometric grid: equal percentage spacing
                const ratio = upperPrice.div(lowerPrice).pow(1 / gridCount);
                price = lowerPrice.times(ratio.pow(i));
            }
            // Round to price precision
            const roundedPrice = price.toDecimalPlaces(pricePrecision).toString();
            levels.push({
                levelIndex: i,
                price: roundedPrice,
                status: types_1.GridLevelStatus.IDLE,
                filledQuantity: '0',
            });
        }
        return levels;
    }
    /**
     * Calculate expected profit per grid after fees
     */
    static calculateGridProfit(buyPrice, sellPrice, makerFeeRate, takerFeeRate) {
        const buy = new decimal_js_1.default(buyPrice);
        const sell = new decimal_js_1.default(sellPrice);
        const makerFee = new decimal_js_1.default(makerFeeRate);
        const takerFee = new decimal_js_1.default(takerFeeRate);
        // Gross profit percentage
        const grossProfitPercent = sell.minus(buy).div(buy).times(100);
        // Total fees (buy fee + sell fee)
        const totalFees = makerFee.plus(takerFee).times(100);
        // Net profit percentage
        const netProfitPercent = grossProfitPercent.minus(totalFees);
        return {
            grossProfitPercent: grossProfitPercent.toDecimalPlaces(4).toString(),
            netProfitPercent: netProfitPercent.toDecimalPlaces(4).toString(),
            isProfitable: netProfitPercent.gt(0),
        };
    }
    /**
     * Validate minimum profit after fees
     */
    static validateMinProfit(buyPrice, sellPrice, makerFeeRate, takerFeeRate, minProfitBps) {
        const { netProfitPercent } = this.calculateGridProfit(buyPrice, sellPrice, makerFeeRate, takerFeeRate);
        const minProfitPercent = new decimal_js_1.default(minProfitBps).div(100);
        const actualProfit = new decimal_js_1.default(netProfitPercent);
        if (actualProfit.lt(minProfitPercent)) {
            return {
                valid: false,
                message: `Expected profit ${netProfitPercent}% is below minimum ${minProfitBps} bps (${minProfitPercent}%)`,
            };
        }
        return {
            valid: true,
            message: 'Profit validation passed',
        };
    }
    /**
     * Calculate quantity based on quote allocation
     */
    static calculateBuyQuantity(quoteAmount, price, amountPrecision) {
        const quote = new decimal_js_1.default(quoteAmount);
        const px = new decimal_js_1.default(price);
        if (px.isZero()) {
            throw new Error('Price cannot be zero');
        }
        return quote.div(px).toDecimalPlaces(amountPrecision).toString();
    }
    /**
     * Calculate quote value from base quantity
     */
    static calculateQuoteValue(baseAmount, price, pricePrecision) {
        const base = new decimal_js_1.default(baseAmount);
        const px = new decimal_js_1.default(price);
        return base.times(px).toDecimalPlaces(pricePrecision).toString();
    }
    /**
     * Check if price is within grid range
     */
    static isPriceInRange(price, lowerPrice, upperPrice) {
        const px = new decimal_js_1.default(price);
        const lower = new decimal_js_1.default(lowerPrice);
        const upper = new decimal_js_1.default(upperPrice);
        return px.gte(lower) && px.lte(upper);
    }
    /**
     * Find the nearest grid level below a price (for buy orders)
     */
    static findNearestBuyLevel(levels, currentPrice) {
        const price = new decimal_js_1.default(currentPrice);
        // Find levels below current price
        const belowLevels = levels.filter(level => new decimal_js_1.default(level.price).lt(price));
        if (belowLevels.length === 0) {
            return null;
        }
        // Return the highest level below current price
        return belowLevels.reduce((highest, level) => new decimal_js_1.default(level.price).gt(highest.price) ? level : highest);
    }
    /**
     * Find the nearest grid level above a price (for sell orders)
     */
    static findNearestSellLevel(levels, currentPrice) {
        const price = new decimal_js_1.default(currentPrice);
        // Find levels above current price
        const aboveLevels = levels.filter(level => new decimal_js_1.default(level.price).gt(price));
        if (aboveLevels.length === 0) {
            return null;
        }
        // Return the lowest level above current price
        return aboveLevels.reduce((lowest, level) => new decimal_js_1.default(level.price).lt(lowest.price) ? level : lowest);
    }
}
exports.GridMath = GridMath;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ3JpZC1tYXRoLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ3JpZC1tYXRoLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7OztBQUFBLDREQUFpQztBQUNqQyxtQ0FBMkU7QUFHM0UsTUFBYSxRQUFRO0lBQ25COztPQUVHO0lBQ0gsTUFBTSxDQUFDLGtCQUFrQixDQUFDLE1BQWtCLEVBQUUsY0FBc0I7UUFDbEUsTUFBTSxNQUFNLEdBQWdCLEVBQUUsQ0FBQztRQUMvQixNQUFNLFVBQVUsR0FBRyxJQUFJLG9CQUFPLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDO1FBQ2xELE1BQU0sVUFBVSxHQUFHLElBQUksb0JBQU8sQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUM7UUFDbEQsTUFBTSxTQUFTLEdBQUcsTUFBTSxDQUFDLFNBQVMsQ0FBQztRQUVuQyxJQUFJLFNBQVMsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsQixNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7UUFDbkQsQ0FBQztRQUVELElBQUksVUFBVSxDQUFDLEdBQUcsQ0FBQyxVQUFVLENBQUMsRUFBRSxDQUFDO1lBQy9CLE1BQU0sSUFBSSxLQUFLLENBQUMsMkNBQTJDLENBQUMsQ0FBQztRQUMvRCxDQUFDO1FBRUQsS0FBSyxJQUFJLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxJQUFJLFNBQVMsRUFBRSxDQUFDLEVBQUUsRUFBRSxDQUFDO1lBQ3BDLElBQUksS0FBYyxDQUFDO1lBRW5CLElBQUksTUFBTSxDQUFDLFFBQVEsS0FBSyxnQkFBUSxDQUFDLFVBQVUsRUFBRSxDQUFDO2dCQUM1Qyx1Q0FBdUM7Z0JBQ3ZDLE1BQU0sSUFBSSxHQUFHLFVBQVUsQ0FBQyxLQUFLLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FBQyxDQUFDO2dCQUN6RCxLQUFLLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFD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QUksV0FBVyxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsQ0FBQztZQUM3QixPQUFPLElBQUksQ0FBQztRQUNkLENBQUM7UUFFRCw4Q0FBOEM7UUFDOUMsT0FBTyxXQUFXLENBQUMsTUFBTSxDQUFDLENBQUMsTUFBTSxFQUFFLEtBQUssRUFBRSxFQUFFLENBQzFDLElBQUksb0JBQU8sQ0FBQyxLQUFLLENBQUMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQzNELENBQUM7SUFDSixDQUFDO0NBQ0Y7QUF4TUQsNEJBd01DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IERlY2ltYWwgZnJvbSAnZGVjaW1hbC5qcyc7XG5pbXBvcnQgeyBHcmlkVHlwZSwgR3JpZENvbmZpZywgR3JpZExldmVsLCBHcmlkTGV2ZWxTdGF0dXMgfSBmcm9tICcuL3R5cGVzJztcbmltcG9ydCB7IERlY2ltYWxVdGlscyB9IGZyb20gJy4vZGVjaW1hbC11dGlscyc7XG5cbmV4cG9ydCBjbGFzcyBHcmlkTWF0aCB7XG4gIC8qKlxuICAgKiBHZW5lcmF0ZSBncmlkIGxldmVscyBiYXNlZCBvbiBjb25maWd1cmF0aW9uXG4gICAqL1xuICBzdGF0aWMgZ2VuZXJhdGVHcmlkTGV2ZWxzKGNvbmZpZzogR3JpZENvbmZpZywgcHJpY2VQcmVjaXNpb246IG51bWJlcik6IEdyaWRMZXZlbFtdIHtcbiAgICBjb25zdCBsZXZlbHM6IEdyaWRMZXZlbFtdID0gW107XG4gICAgY29uc3QgbG93ZXJQcmljZSA9IG5ldyBEZWNpbWFsKGNvbmZpZy5sb3dlclByaWNlKTtcbiAgICBjb25zdCB1cHBlclByaWNlID0gbmV3IERlY2ltYWwoY29uZmlnLnVwcGVyUHJpY2UpO1xuICAgIGNvbnN0IGdyaWRDb3VudCA9IGNvbmZpZy5ncmlkQ291bnQ7XG5cbiAgICBpZiAoZ3JpZENvdW50IDwgMikge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdHcmlkIGNvdW50IG11c3QgYmUgYXQgbGVhc3QgMicpO1xuICAgIH1cblxuICAgIGlmIChsb3dlclByaWNlLmd0ZSh1cHBlclByaWNlKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdMb3dlciBwcmljZSBtdXN0IGJlIGxlc3MgdGhhbiB1cHBlciBwcmljZScpO1xuICAgIH1cblxuICAgIGZvciAobGV0IGkgPSAwOyBpIDw9IGdyaWRDb3VudDsgaSsrKSB7XG4gICAgICBsZXQgcHJpY2U6IERlY2ltYWw7XG5cbiAgICAgIGlmIChjb25maWcuZ3JpZFR5cGUgPT09IEdyaWRUeXBlLkFSSVRITUVUSUMpIHtcbiAgICAgICAgLy8gQXJpdGhtZXRpYyBncmlkOiBlcXVhbCBwcmljZSBzcGFjaW5nXG4gICAgICAgIGNvbnN0IHN0ZXAgPSB1cHBlclByaWNlLm1pbnVzKGxvd2VyUHJpY2UpLmRpdihncmlkQ291bnQpO1xuICAgICAgICBwcmljZSA9IGxvd2VyUHJpY2UucGx1cyhzdGVwLnRpbWVzKGkpKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIC8vIEdlb21ldHJpYyBncmlkOiBlcXVhbCBwZXJjZW50YWdlIHNwYWNpbmdcbiAgICAgICAgY29uc3QgcmF0aW8gPSB1cHBlclByaWNlLmRpdihsb3dlclByaWNlKS5wb3coMSAvIGdyaWRDb3VudCk7XG4gICAgICAgIHByaWNlID0gbG93ZXJQcmljZS50aW1lcyhyYXRpby5wb3coaSkpO1xuICAgICAgfVxuXG4gICAgICAvLyBSb3VuZCB0byBwcmljZSBwcmVjaXNpb25cbiAgICAgIGNvbnN0IHJvdW5kZWRQcmljZSA9IHByaWNlLnRvRGVjaW1hbFBsYWNlcyhwcmljZVByZWNpc2lvbikudG9TdHJpbmcoKTtcblxuICAgICAgbGV2ZWxzLnB1c2goe1xuICAgICAgICBsZXZlbEluZGV4OiBpLFxuICAgICAgICBwcmljZTogcm91bmRlZFByaWNlLFxuICAgICAgICBzdGF0dXM6IEdyaWRMZXZlbFN0YXR1cy5JRExFLFxuICAgICAgICBmaWxsZWRRdWFudGl0eTogJzAnLFxuICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIGxldmVscztcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgZXhwZWN0ZWQgcHJvZml0IHBlciBncmlkIGFmdGVyIGZlZXNcbiAgICovXG4gIHN0YXRpYyBjYWxjdWxhdGVHcmlkUHJvZml0KFxuICAgIGJ1eVByaWNlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgc2VsbFByaWNlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgbWFrZXJGZWVSYXRlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgdGFrZXJGZWVSYXRlOiBzdHJpbmcgfCBudW1iZXJcbiAgKToge1xuICAgIGdyb3NzUHJvZml0UGVyY2VudDogc3RyaW5nO1xuICAgIG5ldFByb2ZpdFBlcmNlbnQ6IHN0cmluZztcbiAgICBpc1Byb2ZpdGFibGU6IGJvb2xlYW47XG4gIH0ge1xuICAgIGNvbnN0IGJ1eSA9IG5ldyBEZWNpbWFsKGJ1eVByaWNlKTtcbiAgICBjb25zdCBzZWxsID0gbmV3IERlY2ltYWwoc2VsbFByaWNlKTtcbiAgICBjb25zdCBtYWtlckZlZSA9IG5ldyBEZWNpbWFsKG1ha2VyRmVlUmF0ZSk7XG4gICAgY29uc3QgdGFrZXJGZWUgPSBuZXcgRGVjaW1hbCh0YWtlckZlZVJhdGUpO1xuXG4gICAgLy8gR3Jvc3MgcHJvZml0IHBlcmNlbnRhZ2VcbiAgICBjb25zdCBncm9zc1Byb2ZpdFBlcmNlbnQgPSBzZWxsLm1pbnVzKGJ1eSkuZGl2KGJ1eSkudGltZXMoMTAwKTtcblxuICAgIC8vIFRvdGFsIGZlZXMgKGJ1eSBmZWUgKyBzZWxsIGZlZSlcbiAgICBjb25zdCB0b3RhbEZlZXMgPSBtYWtlckZlZS5wbHVzKHRha2VyRmVlKS50aW1lcygxMDApO1xuXG4gICAgLy8gTmV0IHByb2ZpdCBwZXJjZW50YWdlXG4gICAgY29uc3QgbmV0UHJvZml0UGVyY2VudCA9IGdyb3NzUHJvZml0UGVyY2VudC5taW51cyh0b3RhbEZlZXMpO1xuXG4gICAgcmV0dXJuIHtcbiAgICAgIGdyb3NzUHJvZml0UGVyY2VudDogZ3Jvc3NQcm9maXRQZXJjZW50LnRvRGVjaW1hbFBsYWNlcyg0KS50b1N0cmluZygpLFxuICAgICAgbmV0UHJvZml0UGVyY2VudDogbmV0UHJvZml0UGVyY2VudC50b0RlY2ltYWxQbGFjZXMoNCkudG9TdHJpbmcoKSxcbiAgICAgIGlzUHJvZml0YWJsZTogbmV0UHJvZml0UGVyY2VudC5ndCgwKSxcbiAgICB9O1xuICB9XG5cbiAgLyoqXG4gICAqIFZhbGlkYXRlIG1pbmltdW0gcHJvZml0IGFmdGVyIGZlZXNcbiAgICovXG4gIHN0YXRpYyB2YWxpZGF0ZU1pblByb2ZpdChcbiAgICBidXlQcmljZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIHNlbGxQcmljZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIG1ha2VyRmVlUmF0ZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIHRha2VyRmVlUmF0ZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIG1pblByb2ZpdEJwczogbnVtYmVyXG4gICk6IHsgdmFsaWQ6IGJvb2xlYW47IG1lc3NhZ2U6IHN0cmluZyB9IHtcbiAgICBjb25zdCB7IG5ldFByb2ZpdFBlcmNlbnQgfSA9IHRoaXMuY2FsY3VsYXRlR3JpZFByb2ZpdChcbiAgICAgIGJ1eVByaWNlLFxuICAgICAgc2VsbFByaWNlLFxuICAgICAgbWFrZXJGZWVSYXRlLFxuICAgICAgdGFrZXJGZWVSYXRlXG4gICAgKTtcblxuICAgIGNvbnN0IG1pblByb2ZpdFBlcmNlbnQgPSBuZXcgRGVjaW1hbChtaW5Qcm9maXRCcHMpLmRpdigxMDApO1xuICAgIGNvbnN0IGFjdHVhbFByb2ZpdCA9IG5ldyBEZWNpbWFsKG5ldFByb2ZpdFBlcmNlbnQpO1xuXG4gICAgaWYgKGFjdHVhbFByb2ZpdC5sdChtaW5Qcm9maXRQZXJjZW50KSkge1xuICAgICAgcmV0dXJuIHtcbiAgICAgICAgdmFsaWQ6IGZhbHNlLFxuICAgICAgICBtZXNzYWdlOiBgRXhwZWN0ZWQgcHJvZml0ICR7bmV0UHJvZml0UGVyY2VudH0lIGlzIGJlbG93IG1pbmltdW0gJHttaW5Qcm9maXRCcHN9IGJwcyAoJHttaW5Qcm9maXRQZXJjZW50fSUpYCxcbiAgICAgIH07XG4gICAgfVxuXG4gICAgcmV0dXJuIHtcbiAgICAgIHZhbGlkOiB0cnVlLFxuICAgICAgbWVzc2FnZTogJ1Byb2ZpdCB2YWxpZGF0aW9uIHBhc3NlZCcsXG4gICAgfTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDYWxjdWxhdGUgcXVhbnRpdHkgYmFzZWQgb24gcXVvdGUgYWxsb2NhdGlvblxuICAgKi9cbiAgc3RhdGljIGNhbGN1bGF0ZUJ1eVF1YW50aXR5KFxuICAgIHF1b3RlQW1vdW50OiBzdHJpbmcgfCBudW1iZXIsXG4gICAgcHJpY2U6IHN0cmluZyB8IG51bWJlcixcbiAgICBhbW91bnRQcmVjaXNpb246IG51bWJlclxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IHF1b3RlID0gbmV3IERlY2ltYWwocXVvdGVBbW91bnQpO1xuICAgIGNvbnN0IHB4ID0gbmV3IERlY2ltYWwocHJpY2UpO1xuICAgIFxuICAgIGlmIChweC5pc1plcm8oKSkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKCdQcmljZSBjYW5ub3QgYmUgemVybycpO1xuICAgIH1cblxuICAgIHJldHVybiBxdW90ZS5kaXYocHgpLnRvRGVjaW1hbFBsYWNlcyhhbW91bnRQcmVjaXNpb24pLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2FsY3VsYXRlIHF1b3RlIHZhbHVlIGZyb20gYmFzZSBxdWFudGl0eVxuICAgKi9cbiAgc3RhdGljIGNhbGN1bGF0ZVF1b3RlVmFsdWUoXG4gICAgYmFzZUFtb3VudDogc3RyaW5nIHwgbnVtYmVyLFxuICAgIHByaWNlOiBzdHJpbmcgfCBudW1iZXIsXG4gICAgcHJpY2VQcmVjaXNpb246IG51bWJlclxuICApOiBzdHJpbmcge1xuICAgIGNvbnN0IGJhc2UgPSBuZXcgRGVjaW1hbChiYXNlQW1vdW50KTtcbiAgICBjb25zdCBweCA9IG5ldyBEZWNpbWFsKHByaWNlKTtcblxuICAgIHJldHVybiBiYXNlLnRpbWVzKHB4KS50b0RlY2ltYWxQbGFjZXMocHJpY2VQcmVjaXNpb24pLnRvU3RyaW5nKCk7XG4gIH1cblxuICAvKipcbiAgICogQ2hlY2sgaWYgcHJpY2UgaXMgd2l0aGluIGdyaWQgcmFuZ2VcbiAgICovXG4gIHN0YXRpYyBpc1ByaWNlSW5SYW5nZShcbiAgICBwcmljZTogc3RyaW5nIHwgbnVtYmVyLFxuICAgIGxvd2VyUHJpY2U6IHN0cmluZyB8IG51bWJlcixcbiAgICB1cHBlclByaWNlOiBzdHJpbmcgfCBudW1iZXJcbiAgKTogYm9vbGVhbiB7XG4gICAgY29uc3QgcHggPSBuZXcgRGVjaW1hbChwcmljZSk7XG4gICAgY29uc3QgbG93ZXIgPSBuZXcgRGVjaW1hbChsb3dlclByaWNlKTtcbiAgICBjb25zdCB1cHBlciA9IG5ldyBEZWNpbWFsKHVwcGVyUHJpY2UpO1xuXG4gICAgcmV0dXJuIHB4Lmd0ZShsb3dlcikgJiYgcHgubHRlKHVwcGVyKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBGaW5kIHRoZSBuZWFyZXN0IGdyaWQgbGV2ZWwgYmVsb3cgYSBwcmljZSAoZm9yIGJ1eSBvcmRlcnMpXG4gICAqL1xuICBzdGF0aWMgZmluZE5lYXJlc3RCdXlMZXZlbChsZXZlbHM6IEdyaWRMZXZlbFtdLCBjdXJyZW50UHJpY2U6IHN0cmluZyB8IG51bWJlcik6IEdyaWRMZXZlbCB8IG51bGwge1xuICAgIGNvbnN0IHByaWNlID0gbmV3IERlY2ltYWwoY3VycmVudFByaWNlKTtcbiAgICBcbiAgICAvLyBGaW5kIGxldmVscyBiZWxvdyBjdXJyZW50IHByaWNlXG4gICAgY29uc3QgYmVsb3dMZXZlbHMgPSBsZXZlbHMuZmlsdGVyKGxldmVsID0+IFxuICAgICAgbmV3IERlY2ltYWwobGV2ZWwucHJpY2UpLmx0KHByaWNlKVxuICAgICk7XG5cbiAgICBpZiAoYmVsb3dMZXZlbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIGhpZ2hlc3QgbGV2ZWwgYmVsb3cgY3VycmVudCBwcmljZVxuICAgIHJldHVybiBiZWxvd0xldmVscy5yZWR1Y2UoKGhpZ2hlc3QsIGxldmVsKSA9PiBcbiAgICAgIG5ldyBEZWNpbWFsKGxldmVsLnByaWNlKS5ndChoaWdoZXN0LnByaWNlKSA/IGxldmVsIDogaGlnaGVzdFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogRmluZCB0aGUgbmVhcmVzdCBncmlkIGxldmVsIGFib3ZlIGEgcHJpY2UgKGZvciBzZWxsIG9yZGVycylcbiAgICovXG4gIHN0YXRpYyBmaW5kTmVhcmVzdFNlbGxMZXZlbChsZXZlbHM6IEdyaWRMZXZlbFtdLCBjdXJyZW50UHJpY2U6IHN0cmluZyB8IG51bWJlcik6IEdyaWRMZXZlbCB8IG51bGwge1xuICAgIGNvbnN0IHByaWNlID0gbmV3IERlY2ltYWwoY3VycmVudFByaWNlKTtcbiAgICBcbiAgICAvLyBGaW5kIGxldmVscyBhYm92ZSBjdXJyZW50IHByaWNlXG4gICAgY29uc3QgYWJvdmVMZXZlbHMgPSBsZXZlbHMuZmlsdGVyKGxldmVsID0+IFxuICAgICAgbmV3IERlY2ltYWwobGV2ZWwucHJpY2UpLmd0KHByaWNlKVxuICAgICk7XG5cbiAgICBpZiAoYWJvdmVMZXZlbHMubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG5cbiAgICAvLyBSZXR1cm4gdGhlIGxvd2VzdCBsZXZlbCBhYm92ZSBjdXJyZW50IHByaWNlXG4gICAgcmV0dXJuIGFib3ZlTGV2ZWxzLnJlZHVjZSgobG93ZXN0LCBsZXZlbCkgPT4gXG4gICAgICBuZXcgRGVjaW1hbChsZXZlbC5wcmljZSkubHQobG93ZXN0LnByaWNlKSA/IGxldmVsIDogbG93ZXN0XG4gICAgKTtcbiAgfVxufVxuIl19