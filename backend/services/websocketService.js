/**
 * WebSocket Service - Comunicação em tempo real
 * Gerencia conexões WebSocket para atualizações instantâneas
 */

const WebSocket = require('ws');
const EventEmitter = require('events');
const logger = require('../utils/logger');

class WebSocketService extends EventEmitter {
  constructor() {
    super();
    this.wss = null;
    this.clients = new Map(); // clientId -> { ws, address, subscriptions }
    this.heartbeatInterval = 30000; // 30 segundos
    this.heartbeatTimer = null;
    this.connectionCount = 0;
  }

  /**
   * Inicializa o servidor WebSocket
   */
  initialize(server) {
    try {
      this.wss = new WebSocket.Server({ 
        server,
        path: '/ws',
        verifyClient: this.verifyClient.bind(this)
      });

      this.wss.on('connection', this.handleConnection.bind(this));
      this.setupHeartbeat();
      
      logger.info('WebSocket Server inicializado na rota /ws');
      
    } catch (error) {
      logger.error(`Erro ao inicializar WebSocket: ${error.message}`);
      throw error;
    }
  }

  /**
   * Verifica se o cliente pode conectar
   */
  verifyClient(info) {
    // Aqui você pode adicionar validações de autenticação
    return true;
  }

  /**
   * Manipula nova conexão WebSocket
   */
  handleConnection(ws, request) {
    const clientId = this.generateClientId();
    const clientInfo = {
      ws,
      address: null,
      subscriptions: new Set(),
      lastPing: Date.now(),
      connected: true
    };

    this.clients.set(clientId, clientInfo);
    this.connectionCount++;

    logger.info(`Nova conexão WebSocket: ${clientId} (Total: ${this.connectionCount})`);

    // Configurar eventos do cliente
    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));
    ws.on('pong', () => this.handlePong(clientId));

    // Enviar mensagem de boas-vindas
    this.sendToClient(clientId, {
      type: 'connection_established',
      clientId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manipula mensagens recebidas dos clientes
   */
  handleMessage(clientId, rawData) {
    try {
      const data = JSON.parse(rawData);
      const client = this.clients.get(clientId);
      
      if (!client) {
        logger.warn(`Mensagem recebida de cliente inexistente: ${clientId}`);
        return;
      }

      logger.debug(`Mensagem recebida de ${clientId}:`, data);

      switch (data.type) {
        case 'wallet_connected':
          this.handleWalletConnected(clientId, data);
          break;
          
        case 'wallet_disconnected':
          this.handleWalletDisconnected(clientId, data);
          break;
          
        case 'subscribe_wallet_updates':
          this.handleSubscribeWalletUpdates(clientId, data);
          break;
          
        case 'unsubscribe_wallet_updates':
          this.handleUnsubscribeWalletUpdates(clientId, data);
          break;
          
        case 'ping':
          this.handleClientPing(clientId, data);
          break;
          
        default:
          logger.warn(`Tipo de mensagem desconhecido: ${data.type}`);
          this.sendError(clientId, 'UNKNOWN_MESSAGE_TYPE', 'Tipo de mensagem não reconhecido');
      }
      
    } catch (error) {
      logger.error(`Erro ao processar mensagem de ${clientId}: ${error.message}`);
      this.sendError(clientId, 'INVALID_MESSAGE', 'Formato de mensagem inválido');
    }
  }

  /**
   * Manipula carteira conectada
   */
  handleWalletConnected(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { address, walletType, network } = data;
    
    // Validar endereço Stellar
    if (!this.isValidStellarAddress(address)) {
      this.sendError(clientId, 'INVALID_ADDRESS', 'Endereço Stellar inválido');
      return;
    }

    // Atualizar informações do cliente
    client.address = address;
    client.walletType = walletType;
    client.network = network;

    logger.info(`Carteira conectada para cliente ${clientId}: ${address}`);

    // Emitir evento para outros serviços
    this.emit('wallet_connected', {
      clientId,
      address,
      walletType,
      network,
      timestamp: new Date().toISOString()
    });

    // Confirmar conexão
    this.sendToClient(clientId, {
      type: 'wallet_connection_confirmed',
      address,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manipula carteira desconectada
   */
  handleWalletDisconnected(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const previousAddress = client.address;
    
    // Limpar informações da carteira
    client.address = null;
    client.walletType = null;
    client.network = null;
    client.subscriptions.clear();

    logger.info(`Carteira desconectada para cliente ${clientId}: ${previousAddress}`);

    // Emitir evento
    this.emit('wallet_disconnected', {
      clientId,
      previousAddress,
      timestamp: new Date().toISOString()
    });

    // Confirmar desconexão
    this.sendToClient(clientId, {
      type: 'wallet_disconnection_confirmed',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Inscrever cliente em atualizações de carteira
   */
  handleSubscribeWalletUpdates(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || !client.address) {
      this.sendError(clientId, 'NO_WALLET_CONNECTED', 'Nenhuma carteira conectada');
      return;
    }

    const { updateTypes = ['balance', 'transactions', 'score'] } = data;
    
    updateTypes.forEach(type => {
      client.subscriptions.add(type);
    });

    logger.info(`Cliente ${clientId} inscrito em atualizações: ${updateTypes.join(', ')}`);

    // Emitir evento para iniciar monitoramento
    this.emit('subscribe_updates', {
      clientId,
      address: client.address,
      updateTypes,
      timestamp: new Date().toISOString()
    });

    // Confirmar inscrição
    this.sendToClient(clientId, {
      type: 'subscription_confirmed',
      updateTypes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Cancelar inscrição em atualizações
   */
  handleUnsubscribeWalletUpdates(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    const { updateTypes = [] } = data;
    
    if (updateTypes.length === 0) {
      // Cancelar todas as inscrições
      client.subscriptions.clear();
    } else {
      updateTypes.forEach(type => {
        client.subscriptions.delete(type);
      });
    }

    logger.info(`Cliente ${clientId} cancelou inscrições: ${updateTypes.join(', ')}`);

    // Emitir evento
    this.emit('unsubscribe_updates', {
      clientId,
      address: client.address,
      updateTypes,
      timestamp: new Date().toISOString()
    });

    // Confirmar cancelamento
    this.sendToClient(clientId, {
      type: 'unsubscription_confirmed',
      updateTypes,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manipula ping do cliente
   */
  handleClientPing(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastPing = Date.now();
    
    this.sendToClient(clientId, {
      type: 'pong',
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Manipula pong do cliente
   */
  handlePong(clientId) {
    const client = this.clients.get(clientId);
    if (client) {
      client.lastPing = Date.now();
    }
  }

  /**
   * Manipula desconexão do cliente
   */
  handleDisconnection(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    logger.info(`Cliente desconectado: ${clientId}`);

    // Emitir evento se havia carteira conectada
    if (client.address) {
      this.emit('wallet_disconnected', {
        clientId,
        previousAddress: client.address,
        timestamp: new Date().toISOString()
      });
    }

    // Remover cliente
    this.clients.delete(clientId);
    this.connectionCount--;

    logger.info(`Total de conexões: ${this.connectionCount}`);
  }

  /**
   * Manipula erros de conexão
   */
  handleError(clientId, error) {
    logger.error(`Erro na conexão WebSocket ${clientId}: ${error.message}`);
    
    const client = this.clients.get(clientId);
    if (client) {
      client.connected = false;
    }
  }

  /**
   * Envia mensagem para cliente específico
   */
  sendToClient(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client || !client.connected || client.ws.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.ws.send(JSON.stringify(message));
      return true;
    } catch (error) {
      logger.error(`Erro ao enviar mensagem para ${clientId}: ${error.message}`);
      return false;
    }
  }

  /**
   * Envia erro para cliente
   */
  sendError(clientId, code, message) {
    this.sendToClient(clientId, {
      type: 'error',
      error: {
        code,
        message,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Broadcast de atualizações para clientes inscritos
   */
  broadcastWalletUpdate(address, updateType, data) {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients) {
      if (client.address === address && client.subscriptions.has(updateType)) {
        const success = this.sendToClient(clientId, {
          type: 'wallet_update',
          updateType,
          address,
          data,
          timestamp: new Date().toISOString()
        });
        
        if (success) sentCount++;
      }
    }

    if (sentCount > 0) {
      logger.debug(`Atualização ${updateType} enviada para ${sentCount} clientes (${address})`);
    }

    return sentCount;
  }

  /**
   * Broadcast geral para todos os clientes
   */
  broadcast(message) {
    let sentCount = 0;
    
    for (const [clientId, client] of this.clients) {
      if (this.sendToClient(clientId, message)) {
        sentCount++;
      }
    }

    return sentCount;
  }

  /**
   * Configura heartbeat para manter conexões vivas
   */
  setupHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      const now = Date.now();
      const deadClients = [];

      for (const [clientId, client] of this.clients) {
        if (now - client.lastPing > this.heartbeatInterval * 2) {
          deadClients.push(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          client.ws.ping();
        }
      }

      // Remover clientes mortos
      deadClients.forEach(clientId => {
        logger.warn(`Removendo cliente inativo: ${clientId}`);
        this.handleDisconnection(clientId);
      });

    }, this.heartbeatInterval);
  }

  /**
   * Gera ID único para cliente
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Valida endereço Stellar
   */
  isValidStellarAddress(address) {
    if (!address || typeof address !== 'string') return false;
    return address.length === 56 && address.startsWith('G');
  }

  /**
   * Obtém estatísticas do serviço
   */
  getStats() {
    const stats = {
      totalConnections: this.connectionCount,
      connectedWallets: 0,
      activeSubscriptions: 0,
      uptime: process.uptime()
    };

    for (const [clientId, client] of this.clients) {
      if (client.address) stats.connectedWallets++;
      stats.activeSubscriptions += client.subscriptions.size;
    }

    return stats;
  }

  /**
   * Shutdown graceful
   */
  shutdown() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket Server encerrado');
      });
    }

    this.clients.clear();
    this.connectionCount = 0;
  }
}

module.exports = new WebSocketService();
