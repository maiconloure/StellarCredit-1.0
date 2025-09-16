/**
 * AI Service - Integração com sistema de IA para cálculo de score
 * Interface entre backend e engine de IA
 */

const axios = require('axios');
const logger = require('../utils/logger');

class AIService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = parseInt(process.env.AI_SERVICE_TIMEOUT) || 30000;
    this.mockEnabled = process.env.MOCK_DATA_ENABLED === 'true';
  }

  async initialize() {
    try {
      if (!this.mockEnabled) {
        // Testar conexão com serviço de IA
        const response = await axios.get(`${this.aiServiceUrl}/health`, {
          timeout: 5000
        });
        
        if (response.data.status === 'healthy') {
          logger.info('AI Service conectado com sucesso');
        }
      } else {
        logger.info('AI Service em modo mock habilitado');
      }
    } catch (error) {
      logger.warn(`AI Service não disponível, usando modo mock: ${error.message}`);
      this.mockEnabled = true;
    }
  }

  /**
   * Calcula score de crédito usando IA
   */
  async calculateScore(address, walletData) {
    try {
      if (this.mockEnabled || !walletData.exists) {
        return this.getMockScore(address, walletData);
      }

      const response = await axios.post(`${this.aiServiceUrl}/analyze-wallet`, {
        address: address,
        network: 'testnet'
      }, {
        timeout: this.timeout,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const aiResult = response.data;
      
      logger.info(`Score calculado via IA para ${address}: ${aiResult.score}`);
      
      return {
        score: aiResult.score,
        risk_level: aiResult.risk_level,
        metrics: {
          total_volume_3m: aiResult.metrics.total_volume_3m,
          transaction_count_3m: aiResult.metrics.transaction_count_3m,
          avg_balance: aiResult.metrics.avg_balance,
          payment_punctuality: aiResult.metrics.payment_punctuality,
          usage_frequency: aiResult.metrics.usage_frequency,
          diversification_score: aiResult.metrics.diversification_score,
          age_score: aiResult.metrics.age_score || 0,
          network_activity: aiResult.metrics.network_activity || 0
        },
        recommendations: aiResult.recommendations || [],
        analysis_timestamp: aiResult.analysis_timestamp
      };

    } catch (error) {
      logger.error(`Erro no cálculo de score via IA: ${error.message}`);
      
      // Fallback para cálculo mock em caso de erro
      return this.getMockScore(address, walletData);
    }
  }

  /**
   * Cálculo mock de score para desenvolvimento/fallback
   */
  getMockScore(address, walletData) {
    // Score baseado no hash do endereço para consistência
    const addressHash = this.hashAddress(address);
    
    let baseScore = 300; // Score mínimo
    let riskLevel = 'HIGH';
    let metrics = {
      total_volume_3m: 0,
      transaction_count_3m: 0,
      avg_balance: 0,
      payment_punctuality: 0,
      usage_frequency: 0,
      diversification_score: 0,
      age_score: 0,
      network_activity: 0
    };

    if (walletData && walletData.exists) {
      const { transactions, operations, balances } = walletData;
      
      // Calcular métricas básicas
      const txCount = transactions.records?.length || 0;
      const opCount = operations?.length || 0;
      const balance = balances?.reduce((sum, b) => sum + parseFloat(b.balance), 0) || 0;

      // Volume estimado (simplificado)
      const estimatedVolume = opCount * 50; // $50 médio por operação
      
      // Frequência (transações por mês)
      const frequency = txCount > 0 ? Math.min(txCount / 3, 30) : 0; // max 30/mês
      
      // Pontualidade (% de transações bem-sucedidas)
      const successfulTx = transactions.records?.filter(tx => tx.successful).length || 0;
      const punctuality = txCount > 0 ? successfulTx / txCount : 0;
      
      // Diversificação (baseada em tipos de operação)
      const uniqueOpTypes = new Set(operations?.map(op => op.type) || []).size;
      const diversification = Math.min(uniqueOpTypes / 5, 1);
      
      // Idade da carteira (baseada na primeira transação)
      const firstTx = transactions.records?.[transactions.records.length - 1];
      const ageInDays = firstTx ? 
        (Date.now() - new Date(firstTx.created_at).getTime()) / (1000 * 60 * 60 * 24) : 
        0;
      const ageScore = Math.min(ageInDays / 365, 1);

      metrics = {
        total_volume_3m: estimatedVolume,
        transaction_count_3m: opCount,
        avg_balance: balance,
        payment_punctuality: punctuality,
        usage_frequency: frequency,
        diversification_score: diversification,
        age_score: ageScore,
        network_activity: Math.min(txCount / 50, 1)
      };

      // Calcular score baseado nas métricas
      const volumeScore = Math.min(estimatedVolume / 10000, 1) * 200;
      const frequencyScore = Math.min(frequency / 20, 1) * 150;
      const punctualityScore = punctuality * 300;
      const diversificationScore = diversification * 200;
      const balanceScore = Math.min(balance / 1000, 1) * 150;

      baseScore = Math.floor(
        volumeScore + 
        frequencyScore + 
        punctualityScore + 
        diversificationScore + 
        balanceScore
      );

      // Ajustar por idade
      baseScore = Math.floor(baseScore * (0.5 + ageScore * 0.5));
    }

    // Adicionar variação baseada no hash do endereço para consistência
    const hashVariation = (addressHash % 200) - 100; // -100 a +100
    baseScore = Math.max(0, Math.min(1000, baseScore + hashVariation));

    // Determinar nível de risco
    if (baseScore >= 700) {
      riskLevel = 'LOW';
    } else if (baseScore >= 400) {
      riskLevel = 'MEDIUM';
    } else {
      riskLevel = 'HIGH';
    }

    // Gerar recomendações
    const recommendations = this.generateRecommendations(baseScore, metrics);

    logger.info(`Score mock calculado para ${address}: ${baseScore}`);

    return {
      score: baseScore,
      risk_level: riskLevel,
      metrics: metrics,
      recommendations: recommendations,
      analysis_timestamp: new Date().toISOString(),
      mock: true
    };
  }

  /**
   * Gera hash numérico do endereço para consistência
   */
  hashAddress(address) {
    let hash = 0;
    for (let i = 0; i < address.length; i++) {
      const char = address.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Gera recomendações baseadas no score e métricas
   */
  generateRecommendations(score, metrics) {
    const recommendations = [];

    if (score < 300) {
      recommendations.push('Comece realizando transações na rede Stellar para construir seu histórico');
      recommendations.push('Mantenha consistência em suas operações financeiras');
    } else if (score < 500) {
      if (metrics.usage_frequency < 5) {
        recommendations.push('Aumente a frequência de transações para melhorar seu score');
      }
      if (metrics.diversification_score < 0.3) {
        recommendations.push('Diversifique os tipos de transações e assets utilizados');
      }
      recommendations.push('Continue construindo seu histórico financeiro na blockchain');
    } else if (score < 700) {
      if (metrics.payment_punctuality < 0.9) {
        recommendations.push('Mantenha alta taxa de sucesso em suas transações');
      }
      if (metrics.avg_balance < 500) {
        recommendations.push('Considere manter um saldo médio mais alto para demonstrar estabilidade');
      }
      recommendations.push('Você está no caminho certo! Continue melhorando suas métricas');
    } else {
      recommendations.push('Excelente perfil financeiro! Continue mantendo seus bons hábitos');
      recommendations.push('Considere explorar produtos financeiros mais avançados');
    }

    // Recomendações específicas por métrica
    if (metrics.diversification_score < 0.5) {
      recommendations.push('Experimente diferentes tipos de operações (pagamentos, DEX, etc.)');
    }

    if (metrics.network_activity < 0.3) {
      recommendations.push('Interaja com mais participantes da rede Stellar');
    }

    return recommendations.slice(0, 4); // Máximo 4 recomendações
  }

  /**
   * Busca análise mockada por perfil
   */
  async getMockAnalysisByProfile(profile) {
    const profiles = {
      good_payer: {
        score: 750,
        risk_level: 'LOW',
        metrics: {
          total_volume_3m: 15000,
          transaction_count_3m: 47,
          avg_balance: 850,
          payment_punctuality: 0.95,
          usage_frequency: 15.7,
          diversification_score: 0.8,
          age_score: 0.9,
          network_activity: 0.7
        },
        recommendations: [
          'Excelente perfil! Continue mantendo seus bons hábitos',
          'Considere diversificar ainda mais seus assets',
          'Explore produtos DeFi avançados na Stellar'
        ]
      },
      medium_payer: {
        score: 450,
        risk_level: 'MEDIUM',
        metrics: {
          total_volume_3m: 3000,
          transaction_count_3m: 20,
          avg_balance: 150,
          payment_punctuality: 0.7,
          usage_frequency: 6.7,
          diversification_score: 0.4,
          age_score: 0.6,
          network_activity: 0.3
        },
        recommendations: [
          'Aumente a frequência de transações',
          'Melhore a pontualidade dos pagamentos',
          'Diversifique os tipos de transação',
          'Mantenha um saldo médio mais alto'
        ]
      },
      new_user: {
        score: 300,
        risk_level: 'HIGH',
        metrics: {
          total_volume_3m: 500,
          transaction_count_3m: 5,
          avg_balance: 50,
          payment_punctuality: 1.0,
          usage_frequency: 1.7,
          diversification_score: 0.2,
          age_score: 0.3,
          network_activity: 0.1
        },
        recommendations: [
          'Continue usando a rede Stellar para construir histórico',
          'Realize mais transações variadas',
          'Mantenha alta taxa de sucesso',
          'Explore diferentes funcionalidades da rede'
        ]
      }
    };

    const profileData = profiles[profile];
    if (!profileData) {
      throw new Error('Perfil não encontrado');
    }

    return {
      ...profileData,
      analysis_timestamp: new Date().toISOString(),
      mock: true,
      profile: profile
    };
  }

  /**
   * Valida entrada para análise
   */
  validateAnalysisInput(address, walletData) {
    if (!address || typeof address !== 'string') {
      throw new Error('Endereço inválido');
    }

    if (address.length !== 56 || !address.startsWith('G')) {
      throw new Error('Formato de endereço Stellar inválido');
    }

    return true;
  }

  /**
   * Processa métricas avançadas (futuro)
   */
  async processAdvancedMetrics(walletData) {
    // Placeholder para análises mais avançadas
    // Como análise de padrões temporais, redes sociais, etc.
    
    return {
      temporal_patterns: {},
      social_network_score: 0,
      market_correlation: 0,
      risk_indicators: []
    };
  }
}

module.exports = new AIService();
