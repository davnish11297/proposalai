"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../utils/auth");
const organizationController_1 = require("../controllers/organizationController");
const router = express_1.default.Router();
router.get('/brand-settings', auth_1.authenticateToken, organizationController_1.OrganizationController.getBrandSettings);
router.put('/brand-settings', auth_1.authenticateToken, organizationController_1.OrganizationController.updateBrandSettings);
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        res.json({
            success: true,
            data: {},
            message: 'Organizations endpoint - implementation pending'
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: 'Failed to fetch organization'
        });
    }
});
exports.default = router;
//# sourceMappingURL=organizations.js.map