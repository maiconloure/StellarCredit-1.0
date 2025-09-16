/**
 * Contract Service - Integração com Smart Contracts Soroban
 * Responsável por interações com contratos Stellar Credit
 */

const StellarSdk = require('@stellar/stellar-sdk');
const { 
  Keypair, 
  TransactionBuilder, 
  Networks, 
  Operation,
  Contract,
  SorobanRpc,
  scValToNative,
  nativeToScVal,
  Address,
  xdr
} = StellarSdk;
const logger = require('../utils/logger');

class ContractService {
  constructor() {
    this.server = null;
    this.rpcServer = null;
    this.network = process.env.STELLAR_NETWORK || 'testnet';
    this.contractAddress = process.env.CONTRACT_ADDRESS;
    this.adminKeypair = null;
    this.networkPassphrase = this.network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC;
  }

  async initialize() {
    try {
      // Configurar servidores
      if (this.network === 'testnet') {
        this.server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
        this.rpcServer = new SorobanRpc.Server('https://soroban-testnet.stellar.org');
      } else {
        this.server = new StellarSdk.Horizon.Server('https://horizon.stellar.org');
        this.rpcServer = new SorobanRpc.Server('https://soroban-mainnet.stellar.org');
      }

      // Configurar admin keypair
      if (process.env.ADMIN_SECRET_KEY && process.env.ADMIN_SECRET_KEY.startsWith('S') && process.env.ADMIN_SECRET_KEY.length === 56) {
        try {
          this.adminKeypair = Keypair.fromSecret(process.env.ADMIN_SECRET_KEY);
          logger.info(`Admin account: ${this.adminKeypair.publicKey()}`);
        } catch (error) {
          logger.warn('ADMIN_SECRET_KEY inválida, usando modo somente leitura');
        }
      } else {
        logger.info('ADMIN_SECRET_KEY não configurada, usando modo somente leitura');
      }

      // Verificar se o contrato existe
      if (this.contractAddress && this.contractAddress.startsWith('C') && this.contractAddress.length === 56) {
        try {
          await this.verifyContract();
        } catch (error) {
          logger.warn(`Erro ao verificar contrato: ${error.message}`);
        }
      } else {
        logger.info('CONTRACT_ADDRESS não configurado ou inválido, usando modo demo');
      }

      logger.info(`Contract Service inicializado na rede: ${this.network}`);
    } catch (error) {
      logger.error(`Erro ao inicializar Contract Service: ${error.message}`);
      throw error;
    }
  }

  async verifyContract() {
    try {
      const contract = new Contract(this.contractAddress);
      
      // Tentar fazer uma chamada simples para verificar se o contrato existe
      const transaction = new TransactionBuilder(
        await this.server.loadAccount(this.adminKeypair.publicKey()),
        {
          fee: '100',
          networkPassphrase: this.networkPassphrase,
        }
      )
      .addOperation(contract.call('get_score', Address.fromString('GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF')))
      .setTimeout(30)
      .build();

      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        logger.warn(`Contrato pode não estar implantado corretamente: ${simulated.error}`);
      } else {
        logger.info('Contrato verificado com sucesso');
      }
    } catch (error) {
      logger.warn(`Erro na verificação do contrato: ${error.message}`);
    }
  }

  /**
   * Armazena score de crédito no contrato
   */
  async storeScore(address, score, metrics) {
    try {
      if (!this.contractAddress || !this.adminKeypair) {
        throw new Error('Contrato ou admin keypair não configurado');
      }

      const contract = new Contract(this.contractAddress);
      const adminAccount = await this.server.loadAccount(this.adminKeypair.publicKey());

      // Converter métricas para formato do contrato
      const transaction = new TransactionBuilder(adminAccount, {
        fee: '1000000', // 1 XLM de fee para operações Soroban
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call(
          'store_score',
          Address.fromString(address),
          nativeToScVal(Math.floor(metrics.total_volume_3m * 1000000), { type: 'u32' }), // volume em micro-unidades
          nativeToScVal(Math.floor(metrics.payment_punctuality * 100), { type: 'u32' }), // pontualidade em %
          nativeToScVal(Math.floor(metrics.usage_frequency), { type: 'u32' }), // frequência
          nativeToScVal(Math.floor(metrics.diversification_score * 100), { type: 'u32' }), // diversificação em %
          nativeToScVal(Math.floor(metrics.avg_balance * 1000000), { type: 'u32' }) // saldo em micro-unidades
        )
      )
      .setTimeout(30)
      .build();

      // Simular transação
      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        throw new Error(`Erro na simulação: ${simulated.error}`);
      }

      // Preparar e assinar transação
      const prepared = await this.rpcServer.prepareTransaction(transaction);
      prepared.sign(this.adminKeypair);

      // Submeter transação
      const result = await this.rpcServer.sendTransaction(prepared);
      
      // Aguardar confirmação
      const confirmedResult = await this.waitForConfirmation(result.hash);

      logger.info(`Score armazenado no contrato para ${address}. Hash: ${result.hash}`);
      
      return {
        success: true,
        transactionHash: result.hash,
        score: score,
        address: address
      };

    } catch (error) {
      logger.error(`Erro ao armazenar score: ${error.message}`);
      throw error;
    }
  }

  /**
   * Recupera score do contrato
   */
  async getScore(address) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contrato não configurado');
      }

      const contract = new Contract(this.contractAddress);
      
      // Criar transação de consulta
      const sourceAccount = await this.server.loadAccount(this.adminKeypair.publicKey());
      
      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call('get_score', Address.fromString(address))
      )
      .setTimeout(30)
      .build();

      // Simular para obter resultado
      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        if (simulated.error.includes('NO_SCORE')) {
          return null;
        }
        throw new Error(`Erro na consulta: ${simulated.error}`);
      }

      // Converter resultado
      const result = scValToNative(simulated.result.retval);
      
      if (!result) {
        return null;
      }

      return {
        address: result.address,
        score: result.score,
        last_updated: result.last_updated,
        metrics: {
          transaction_volume: result.transaction_volume / 1000000, // converter de micro-unidades
          payment_punctuality: result.payment_punctuality / 100,
          usage_frequency: result.usage_frequency,
          diversification: result.diversification / 100,
          avg_balance: result.avg_balance / 1000000
        }
      };

    } catch (error) {
      logger.error(`Erro ao buscar score: ${error.message}`);
      return null;
    }
  }

  /**
   * Solicita empréstimo via contrato
   */
  async requestLoan(borrowerAddress, amount, durationMonths) {
    try {
      if (!this.contractAddress || !this.adminKeypair) {
        throw new Error('Contrato ou admin keypair não configurado');
      }

      const contract = new Contract(this.contractAddress);
      const adminAccount = await this.server.loadAccount(this.adminKeypair.publicKey());

      const transaction = new TransactionBuilder(adminAccount, {
        fee: '1000000',
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call(
          'request_loan',
          Address.fromString(borrowerAddress),
          nativeToScVal(Math.floor(amount * 1000000), { type: 'u32' }), // valor em micro-unidades
          nativeToScVal(durationMonths, { type: 'u32' })
        )
      )
      .setTimeout(30)
      .build();

      // Simular
      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        throw new Error(`Erro na simulação: ${simulated.error}`);
      }

      // Preparar e submeter
      const prepared = await this.rpcServer.prepareTransaction(transaction);
      prepared.sign(this.adminKeypair);

      const result = await this.rpcServer.sendTransaction(prepared);
      const confirmedResult = await this.waitForConfirmation(result.hash);

      // Extrair loan ID do resultado
      const loanId = scValToNative(simulated.result.retval);

      logger.info(`Empréstimo solicitado. ID: ${loanId}, Hash: ${result.hash}`);

      return {
        success: true,
        loanId: loanId,
        transactionHash: result.hash,
        status: 'PENDING' // ou 'APPROVED' se auto-aprovado
      };

    } catch (error) {
      logger.error(`Erro ao solicitar empréstimo: ${error.message}`);
      throw error;
    }
  }

  /**
   * Busca informações de empréstimo
   */
  async getLoan(loanId) {
    try {
      if (!this.contractAddress) {
        throw new Error('Contrato não configurado');
      }

      const contract = new Contract(this.contractAddress);
      const sourceAccount = await this.server.loadAccount(this.adminKeypair.publicKey());

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call('get_loan', nativeToScVal(loanId, { type: 'u32' }))
      )
      .setTimeout(30)
      .build();

      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        return null;
      }

      const result = scValToNative(simulated.result.retval);
      
      if (!result) {
        return null;
      }

      return {
        id: result.id,
        borrower: result.borrower,
        amount: result.amount / 1000000, // converter de micro-unidades
        interest_rate: result.interest_rate / 1000000, // converter taxa
        duration_months: result.duration_months,
        status: result.status,
        created_at: result.created_at,
        required_score: result.required_score
      };

    } catch (error) {
      logger.error(`Erro ao buscar empréstimo: ${error.message}`);
      return null;
    }
  }

  /**
   * Busca ofertas de empréstimo baseadas no score
   */
  async getLoanOffers(score) {
    try {
      if (!this.contractAddress) {
        // Retornar ofertas mockadas se contrato não estiver disponível
        return this.getMockLoanOffers(score);
      }

      const contract = new Contract(this.contractAddress);
      const sourceAccount = await this.server.loadAccount(this.adminKeypair.publicKey());

      const transaction = new TransactionBuilder(sourceAccount, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call('get_loan_offers', nativeToScVal(score, { type: 'u32' }))
      )
      .setTimeout(30)
      .build();

      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        return this.getMockLoanOffers(score);
      }

      const result = scValToNative(simulated.result.retval);
      
      return result.map(offer => ({
        amount: offer[0] / 1000000, // converter de micro-unidades
        interest_rate: offer[1] / 1000000, // converter taxa
        duration_months: offer[2],
        description: this.generateOfferDescription(offer[0] / 1000000, offer[1] / 1000000, offer[2])
      }));

    } catch (error) {
      logger.error(`Erro ao buscar ofertas: ${error.message}`);
      return this.getMockLoanOffers(score);
    }
  }

  /**
   * Ofertas mockadas para fallback
   */
  getMockLoanOffers(score) {
    const offers = [];

    if (score >= 750) {
      offers.push(
        {
          amount: 2000,
          interest_rate: 0.02,
          duration_months: 12,
          description: 'Empréstimo Premium - Taxa baixa para excelente histórico'
        },
        {
          amount: 1000,
          interest_rate: 0.015,
          duration_months: 6,
          description: 'Empréstimo Rápido - Curto prazo com taxa especial'
        }
      );
    } else if (score >= 600) {
      offers.push(
        {
          amount: 1000,
          interest_rate: 0.025,
          duration_months: 12,
          description: 'Empréstimo Padrão - Boas condições'
        },
        {
          amount: 500,
          interest_rate: 0.02,
          duration_months: 6,
          description: 'Empréstimo Rápido - Valor menor, taxa melhor'
        }
      );
    } else if (score >= 450) {
      offers.push(
        {
          amount: 500,
          interest_rate: 0.04,
          duration_months: 12,
          description: 'Empréstimo Intermediário'
        },
        {
          amount: 200,
          interest_rate: 0.035,
          duration_months: 6,
          description: 'Empréstimo Básico - Construa seu histórico'
        }
      );
    } else if (score >= 300) {
      offers.push(
        {
          amount: 200,
          interest_rate: 0.06,
          duration_months: 6,
          description: 'Empréstimo Inicial - Para construir histórico'
        },
        {
          amount: 100,
          interest_rate: 0.05,
          duration_months: 3,
          description: 'Microcrédito - Primeiro empréstimo'
        }
      );
    }

    return offers;
  }

  generateOfferDescription(amount, rate, duration) {
    const ratePercent = (rate * 100).toFixed(1);
    return `Empréstimo de $${amount} com taxa de ${ratePercent}% ao mês por ${duration} meses`;
  }

  /**
   * Aguarda confirmação da transação
   */
  async waitForConfirmation(transactionHash, maxAttempts = 10) {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const result = await this.rpcServer.getTransaction(transactionHash);
        
        if (result.status === 'SUCCESS') {
          return result;
        } else if (result.status === 'FAILED') {
          throw new Error(`Transação falhou: ${result.resultXdr}`);
        }
        
        // Aguardar 2 segundos antes da próxima tentativa
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        if (i === maxAttempts - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    throw new Error('Timeout aguardando confirmação da transação');
  }

  /**
   * Estatísticas da rede (mockadas por enquanto)
   */
  async getNetworkStats() {
    return {
      total_analyzed_wallets: 1547,
      avg_score: 520,
      active_users_3m: 892,
      total_volume_analyzed: 12500000,
      network: this.network,
      contract_address: this.contractAddress,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Aprova empréstimo (função administrativa)
   */
  async approveLoan(loanId) {
    try {
      if (!this.contractAddress || !this.adminKeypair) {
        throw new Error('Contrato ou admin keypair não configurado');
      }

      const contract = new Contract(this.contractAddress);
      const adminAccount = await this.server.loadAccount(this.adminKeypair.publicKey());

      const transaction = new TransactionBuilder(adminAccount, {
        fee: '1000000',
        networkPassphrase: this.networkPassphrase,
      })
      .addOperation(
        contract.call(
          'approve_loan',
          nativeToScVal(loanId, { type: 'u32' })
        )
      )
      .setTimeout(30)
      .build();

      const simulated = await this.rpcServer.simulateTransaction(transaction);
      
      if (simulated.error) {
        throw new Error(`Erro na simulação: ${simulated.error}`);
      }

      const prepared = await this.rpcServer.prepareTransaction(transaction);
      prepared.sign(this.adminKeypair);

      const result = await this.rpcServer.sendTransaction(prepared);
      await this.waitForConfirmation(result.hash);

      logger.info(`Empréstimo ${loanId} aprovado. Hash: ${result.hash}`);

      return {
        success: true,
        loanId: loanId,
        transactionHash: result.hash,
        status: 'APPROVED'
      };

    } catch (error) {
      logger.error(`Erro ao aprovar empréstimo: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ContractService();
