// Event System for Real-Time Updates via SSE
// This module manages broadcast events to connected clients

const EventEmitter = require('events');
const logger = require('./utils/logger');

class EventSystem extends EventEmitter {
  constructor() {
    super();
    this.clients = new Set();
    this.connectedUsers = new Map(); // userId -> Set of clientIds
  }

  // Register a connected SSE client with user info
  registerClient(clientId, res, user = null) {
    const clientObj = { id: clientId, res: res, user: user };
    this.clients.add(clientObj);

    // Track connected users
    if (user && user.id) {
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, new Set());
      }
      this.connectedUsers.get(user.id).add(clientId);

      // Emit user connected event
      this.broadcast('user-connected', {
        userId: user.id,
        username: user.username,
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role, // Include role
        connectedAt: new Date().toISOString()
      });
    }

    logger.debug(`[SSE] Client registered (total: ${this.clients.size}, users: ${this.connectedUsers.size})`);
    return clientObj;
  }

  // Unregister a client
  unregisterClient(clientObj) {
    this.clients.delete(clientObj);

    // Remove from connected users
    if (clientObj.user && clientObj.user.id) {
      const userClients = this.connectedUsers.get(clientObj.user.id);
      if (userClients) {
        userClients.delete(clientObj.id);
        if (userClients.size === 0) {
          this.connectedUsers.delete(clientObj.user.id);

          // Emit user disconnected event
          this.broadcast('user-disconnected', {
            userId: clientObj.user.id,
            username: clientObj.user.username,
            nombre: clientObj.user.nombre,
            apellido: clientObj.user.apellido,
            disconnectedAt: new Date().toISOString()
          });
        }
      }
    }

    logger.debug(`[SSE] Client unregistered (total: ${this.clients.size})`);
  }

  // Forcefully disconnect a user (e.g. on logout)
  disconnectUser(userId) {
    logger.debug(`[SSE] Disconnecting user: ${userId}`);
    const userClients = this.connectedUsers.get(userId);

    if (userClients) {
      // Find all client objects for this user
      const clientsToRemove = [];
      for (const client of this.clients) {
        if (client.user && client.user.id === userId) {
          clientsToRemove.push(client);
        }
      }

      // Close connections and unregister
      clientsToRemove.forEach(client => {
        try {
          client.res.end(); // Close HTTP connection
        } catch (e) {
          logger.error(`[SSE] Error closing connection:`, e.message);
        }
        this.unregisterClient(client);
      });

      logger.debug(`[SSE] Disconnected ${clientsToRemove.length} sessions for user ${userId}`);
      return true;
    }
    return false;
  }

  // Get list of connected users
  getConnectedUsers() {
    const users = [];
    for (const [userId, clientIds] of this.connectedUsers) {
      const user = Array.from(this.clients).find(c => c.user && c.user.id === userId)?.user;
      if (user) {
        users.push({
          id: user.id,
          username: user.username,
          nombre: user.nombre,
          apellido: user.apellido,
          role: user.role, // Include role
          connectedAt: new Date().toISOString(),
          sessionCount: clientIds.size
        });
      }
    }
    return users;
  }

  // Broadcast event to all connected clients
  broadcast(eventType, data) {
    const eventPayload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };

    this.clients.forEach(client => {
      try {
        const eventStr = `event: ${eventType}\n`;
        const dataStr = `data: ${JSON.stringify(eventPayload)}\n\n`;
        // Debug precise format
        if (eventType === 'new-message') {
          console.log('DEBUG_SSE_RAW BROADCAST:', JSON.stringify(eventStr), JSON.stringify(dataStr));
        }
        client.res.write(eventStr);
        client.res.write(dataStr);
      } catch (error) {
        logger.error(`[SSE] Error broadcasting to client:`, error.message);
        this.unregisterClient(client);
      }
    });
  }

  // Emit event to specific users
  emitToUsers(userIds, eventType, data) {
    const eventPayload = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: data
    };

    logger.debug(`[SSE] Emitting ${eventType} to ${userIds.length} users`);

    let sentCount = 0;
    // Find all clients for the specified users
    this.clients.forEach(client => {
      if (client.user && userIds.includes(client.user.id)) {
        try {
          logger.debug(`[SSE] Sending ${eventType} to ${client.user.username}`);
          const eventStr = `event: ${eventType}\n`;
          const dataStr = `data: ${JSON.stringify(eventPayload)}\n\n`;
          // Debug precise format
          console.log('DEBUG_SSE_RAW EMIT:', JSON.stringify(eventStr), JSON.stringify(dataStr));

          client.res.write(eventStr);
          client.res.write(dataStr);
          sentCount++;
        } catch (error) {
          logger.error(`[SSE] Error sending event:`, error.message);
          this.unregisterClient(client);
        }
      }
    });

    logger.debug(`[SSE] Event ${eventType} sent to ${sentCount} clients`);
  }

  // Emit specific entity events
  emitEntityChange(entityType, action, entityId, data = {}) {
    this.broadcast('entity-change', {
      entityType,      // 'cliente', 'suscripcion', 'equipo', etc.
      action,          // 'create', 'update', 'delete'
      entityId,
      ...data
    });
  }
}

// Export singleton instance
module.exports = new EventSystem();
