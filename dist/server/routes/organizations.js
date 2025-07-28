"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const organizationController_1 = require("../controllers/organizationController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.get('/brand-settings', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return organizationController_1.OrganizationController.getBrandSettings(authenticatedReq, res);
});
router.put('/brand-settings', auth_1.authenticateToken, (req, res) => {
    const authenticatedReq = req;
    return organizationController_1.OrganizationController.updateBrandSettings(authenticatedReq, res);
});
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const authenticatedReq = req;
        const organization = await organizationController_1.OrganizationController.getCurrentOrganization(authenticatedReq, res);
        return organization;
    }
    catch (error) {
        console.error('Get organization error:', error);
        return res.status(500).json({ success: false, error: 'Failed to fetch organization' });
    }
});
exports.default = router;
//# sourceMappingURL=organizations.js.map