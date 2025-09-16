# 🌟 Stellar Credit - Plataforma de Score de Crédito Descentralizada

*[English](#english) | [Português](#português)*

---

## 🇧🇷 Português

### 📋 Visão Geral

O **Stellar Credit** é uma solução inovadora que revoluciona o sistema de crédito tradicional usando tecnologia blockchain. Nossa plataforma analisa transações on-chain da rede Stellar para calcular scores de crédito em tempo real e oferecer empréstimos automatizados.

#### 🎯 Problema Resolvido
- **Exclusão Financeira**: 2+ bilhões de pessoas sem acesso a serviços financeiros
- **Processo Lento**: Aprovação de crédito tradicional leva 7+ dias
- **Custo Alto**: Taxas bancárias elevadas para análise de crédito
- **Falta de Transparência**: Algoritmos opacos de scoring

#### 💡 Nossa Solução
- ⚡ **Análise Instantânea**: Score calculado em 30 segundos
- 💰 **90% Mais Barato**: Redução drástica de custos operacionais
- 🌍 **Inclusão Global**: Qualquer carteira Stellar pode participar
- 🔍 **Transparência Total**: Algoritmo auditável e open-source
- 🌍 **Suporte Bilíngue**: Interface em português e inglês

## 🛠️ Stack Tecnológica

### Frontend
- **Next.js 14** + **TypeScript**
- **TailwindCSS** para design responsivo
- **Chart.js** para visualizações
- **Stellar Passkeys** para autenticação

### Backend
- **Node.js** + **Express**
- **Stellar SDK** para integração blockchain
- **SQLite** para dados locais
- **Python** para algoritmos de IA

### Blockchain
- **Soroban Smart Contracts** (Rust)
- **Stellar Testnet** para desenvolvimento
- **Stellar Mainnet** para produção

## 🏗️ Arquitetura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Blockchain    │
│   Dashboard     │◄──►│   API REST      │◄──►│   Soroban       │
│   (Next.js)     │    │   (Node.js)     │    │   Contracts     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐              │
         └─────────────►│   IA Scoring    │◄─────────────┘
                        │   (Python)      │
                        └─────────────────┘
```

## 🚀 Funcionalidades Principais

### 1. 🔐 Autenticação Simplificada
- Conexão via **Stellar Passkeys**
- Autenticação biométrica segura
- Sem necessidade de senhas complexas

### 2. 📊 Análise de Score Inteligente
- **5 Métricas Principais**:
  - Volume de transações (20%)
  - Pontualidade de pagamentos (30%)
  - Frequência de uso (15%)
  - Diversificação de transações (20%)
  - Saldo médio mantido (15%)

### 3. 💰 Ofertas de Empréstimo Personalizadas
- **Score 700+**: Até $1.000 (juros 2%/mês)
- **Score 500-699**: Até $500 (juros 4%/mês)
- **Score 300-499**: Até $200 (juros 6%/mês)

### 4. 📈 Dashboard Interativo
- Score em tempo real
- Histórico de evolução
- Simulador de empréstimos
- Análise de transações

## 🎯 Cronograma de Desenvolvimento (30h)

### Dia 1 (0-12h)
- **H1-2**: Setup do projeto e dados mock
- **H3-6**: Implementação do algoritmo de IA
- **H7-10**: Desenvolvimento do smart contract Soroban
- **H11-12**: Planejamento e revisão

### Dia 2 (12-24h)
- **H13-18**: Frontend base com Passkeys
- **H19-22**: Backend API REST
- **H23-24**: Integração inicial

### Dia 3 (24-30h)
- **H25-28**: Integração completa
- **H29-30**: Testes finais e demo prep

## 📦 Instalação e Execução

### Pré-requisitos
```bash
# Instalar Rust e Soroban CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli

# Node.js e Python
node --version  # v18+
python --version  # v3.8+
```

### Setup do Projeto
```bash
# Clone o repositório
git clone https://github.com/seu-usuario/stellar-credit
cd stellar-credit

# Setup do frontend
cd frontend
npm install
npm run dev

# Setup do backend
cd ../backend
npm install
npm run dev

# Deploy do smart contract
cd ../contracts
soroban contract deploy --network testnet
```

## 🧪 Demonstração

### Personas de Teste
1. **João** (Score 750) - Bom pagador
2. **Maria** (Score 450) - Pagador médio
3. **Carlos** (Score 300) - Novo usuário

### Fluxo da Demo
1. **Conectar Carteira** → Stellar Passkeys
2. **Análise Automática** → Busca transações
3. **Cálculo de Score** → IA processa dados
4. **Ofertas Personalizadas** → Empréstimos disponíveis
5. **Solicitação** → Aprovação instantânea

## 📊 Impacto Esperado

- **Velocidade**: 30 segundos vs 7 dias (tradicional)
- **Custo**: 90% redução em taxas
- **Inclusão**: Acesso global via Stellar
- **Transparência**: Algoritmo auditável

## 🔗 Links Úteis

- [Documentação Stellar](https://developers.stellar.org/)
- [Soroban Docs](https://stellar.org/soroban)
- [Stellar Passkeys](https://stellar.org/blog/foundation-news/introducing-the-new-stellar-passkey-feature-seamless-web3-smart-wallet-functionality-on-mainnet)
- [Testnet Stellar](https://laboratory.stellar.org/)

## 🤝 Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

---

**Desenvolvido com ❤️ para o Hackathon Meridian 2024**

---

## 🇺🇸 English

### 📋 Overview

**Stellar Credit** is an innovative solution that revolutionizes the traditional credit system using blockchain technology. Our platform analyzes on-chain transactions from the Stellar network to calculate credit scores in real-time and offer automated loans.

#### 🎯 Problem Solved
- **Financial Exclusion**: 2+ billion people without access to financial services
- **Slow Process**: Traditional credit approval takes 7+ days
- **High Cost**: Expensive banking fees for credit analysis
- **Lack of Transparency**: Opaque scoring algorithms

#### 💡 Our Solution
- ⚡ **Instant Analysis**: Score calculated in 30 seconds
- 💰 **90% Cheaper**: Drastic reduction in operational costs
- 🌍 **Global Inclusion**: Any Stellar wallet can participate
- 🔍 **Total Transparency**: Auditable and open-source algorithm
- 🌍 **Bilingual Support**: Interface in Portuguese and English

### 🛠️ Technology Stack

#### Frontend
- **Next.js 14** + **TypeScript**
- **TailwindCSS** for responsive design
- **Chart.js** for visualizations
- **Stellar Passkeys** for authentication
- **Bilingual support** (PT/EN)

#### Backend
- **Node.js** + **Express**
- **Stellar SDK** for blockchain integration
- **SQLite** for local data
- **Python** for AI algorithms

#### Blockchain
- **Soroban Smart Contracts** (Rust)
- **Stellar Testnet** for development
- **Stellar Mainnet** for production

### 🚀 Quick Start

#### Prerequisites
```bash
# Install dependencies
node --version  # v18+
python --version  # v3.8+
```

#### Installation
```bash
# Start all services
./start-stellar-credit.sh

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# AI Engine: http://localhost:8000
```

#### Connect Wallet
1. Install [Freighter Wallet](https://freighter.app/)
2. Configure for Testnet
3. Access http://localhost:3000
4. Click "Connect Wallet"
5. Authorize with your biometrics (Passkeys)

### 🤖 Bilingual AI Agents

#### Portuguese Agent
```bash
npx @elizaos/cli start --character stellar-credit-ai-agent.json
```

#### English Agent
```bash
npx @elizaos/cli start --character stellar-credit-ai-agent-en.json
```

### 🌍 Language Support

The platform supports:
- **Portuguese (pt-BR)**: Native Brazilian Portuguese
- **English (en-US)**: International English
- **Auto-detection**: Browser language detection
- **Persistence**: Saves user preference

### 📊 Key Features

#### 🔐 Universal Wallet Support
- **10+ carteiras suportadas**: Freighter, Albedo, Rabet, xBull, LOBSTR, etc.
- **Stellar Passkeys**: Autenticação biométrica
- **Multi-plataforma**: Desktop, mobile, web
- **Carteiras XLM nativas**: Suporte completo

#### 📈 AI-Powered Scoring
- 5 weighted metrics
- Real-time analysis
- Transparent algorithm

#### 💰 Automated Loans
- Instant approval for high scores
- Competitive rates
- Smart contract execution

#### 🌐 Global Accessibility
- Works with any Stellar wallet
- No banking history required
- Inclusive financial system

### 📚 Documentation

- [Quick Start Guide](QUICK_START.md)
- [Wallet Support](WALLET_SUPPORT.md)
- [Bilingual Support](BILINGUAL_SUPPORT.md)
- [Responsive Design](RESPONSIVE_DESIGN.md)
- [Logo Guide](LOGO_GUIDE.md)
- [API Documentation](docs/API_DOCUMENTATION.md)
- [Deployment Guide](docs/DEPLOYMENT.md)
- [Integration Guide](stellar-credit-integration.md)

### 🏆 For Hackathon Meridian 2024

#### Demo Script (5 minutes)
1. **Minute 1**: Present financial exclusion problem
2. **Minute 2**: Connect wallet with Passkeys
3. **Minute 3**: Real-time score calculation
4. **Minute 4**: Automatic loan offers
5. **Minute 5**: Conversational AI agent

#### Competitive Advantages
- 🚀 **90% cheaper** than traditional systems
- ⚡ **200x faster** (30s vs 7 days)
- 🌍 **Global inclusion** for 2+ billion people
- 🔍 **Total transparency** vs opaque banking algorithms
- 🤖 **First conversational AI** for DeFi Credit

### 🤝 Contributing

1. Fork the project
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

### 📄 License

This project is licensed under the MIT License.

**Developed with ❤️ for Hackathon Meridian 2024**
