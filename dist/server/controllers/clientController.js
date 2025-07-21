"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientController = exports.ClientController = void 0;
const database_1 = require("../utils/database");
class ClientController {
    async getClients(req, res) {
        try {
            const clients = await database_1.prisma.client.findMany({
                orderBy: { updatedAt: 'desc' },
            });
            res.json({ success: true, data: clients });
        }
        catch (error) {
            console.error('Get clients error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch clients' });
        }
    }
    async getClient(req, res) {
        try {
            const { id } = req.params;
            const client = await database_1.prisma.client.findFirst({
                where: { id },
            });
            if (!client) {
                res.status(404).json({ success: false, error: 'Client not found' });
                return;
            }
            res.json({ success: true, data: client });
        }
        catch (error) {
            console.error('Get client error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch client' });
        }
    }
    async createClient(req, res) {
        try {
            const { name, email, phone, company, industry, notes } = req.body;
            const client = await database_1.prisma.client.create({
                data: {
                    name,
                    email,
                    phone,
                    company,
                    industry,
                    notes,
                },
            });
            res.status(201).json({ success: true, data: client, message: 'Client created successfully' });
        }
        catch (error) {
            console.error('Create client error:', error);
            res.status(500).json({ success: false, error: 'Failed to create client' });
        }
    }
    async updateClient(req, res) {
        try {
            const { id } = req.params;
            const { name, email } = req.body;
            const client = await database_1.prisma.client.update({
                where: { id },
                data: { name, email },
            });
            res.json({ success: true, data: client, message: 'Client updated successfully' });
        }
        catch (error) {
            console.error('Update client error:', error);
            res.status(500).json({ success: false, error: 'Failed to update client' });
        }
    }
    async deleteClient(req, res) {
        try {
            const { id } = req.params;
            await database_1.prisma.client.delete({ where: { id } });
            res.json({ success: true, message: 'Client deleted successfully' });
        }
        catch (error) {
            console.error('Delete client error:', error);
            res.status(500).json({ success: false, error: 'Failed to delete client' });
        }
    }
}
exports.ClientController = ClientController;
exports.clientController = new ClientController();
//# sourceMappingURL=clientController.js.map