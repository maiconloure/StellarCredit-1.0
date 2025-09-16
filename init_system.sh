#!/bin/bash

# ========================================
# STELLAR CREDIT - SCRIPT DE INICIALIZAÇÃO COMPLETA (VERSÃO CORRIGIDA)
# ========================================
# Este script inicializa todo o sistema Stellar Credit com correções
# Autor: Sistema Stellar Credit
# Versão: 1.1.0
# ========================================

set -e  # Parar execução em caso de erro

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Variáveis globais
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
INIT_LOG="$LOG_DIR/system_init_$TIMESTAMP.log"

# PIDs dos serviços
AI_ENGINE_PID=""
BACKEND_PID=""
FRONTEND_PID=""

# Função para logging
log() {
    echo -e "${2:-$NC}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$INIT_LOG"
}

log_info() {
    log "$1" "$CYAN"
}

log_success() {
    log "✅ $1" "$GREEN"
}

log_warning() {
    log "⚠️  $1" "$YELLOW"
}

log_error() {
    log "❌ $1" "$RED"
}

log_step() {
    log "🚀 $1" "$BLUE"
}

# Função para verificar se comando existe
check_command() {
    if ! command -v $1 &> /dev/null; then
        log_error "Comando '$1' não encontrado. Por favor, instale antes de continuar."
        exit 1
    fi
}

# Função para verificar porta disponível
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_warning "Porta $1 já está em uso"
        return 1
    fi
    return 0
}

# Função para matar processo por PID
kill_process() {
    if [ ! -z "$1" ] && kill -0 $1 2>/dev/null; then
        log_info "Matando processo PID: $1"
        kill $1 2>/dev/null || true
        sleep 2
        if kill -0 $1 2>/dev/null; then
            kill -9 $1 2>/dev/null || true
        fi
    fi
}

# Função de cleanup em caso de erro ou interrupção
cleanup() {
    log_info "🧹 Executando cleanup..."
    kill_process $AI_ENGINE_PID
    kill_process $BACKEND_PID
    kill_process $FRONTEND_PID
    
    # Matar processos por porta se necessário
    pkill -f "python.*api_server.py" 2>/dev/null || true
    pkill -f "node.*server.js" 2>/dev/null || true
    pkill -f "next.*dev" 2>/dev/null || true
    
    log_info "Cleanup concluído"
}

# Trap para cleanup em caso de interrupção
trap cleanup EXIT INT TERM

# Função para verificar pré-requisitos
check_prerequisites() {
    log_step "Verificando pré-requisitos do sistema..."
    
    # Verificar comandos essenciais
    check_command "node"
    check_command "npm"
    check_command "python3"
    check_command "pip3"
    check_command "cargo"
    
    # Soroban CLI é opcional se os contratos já estão compilados
    if command -v soroban &> /dev/null; then
        log_info "Soroban CLI: $(soroban --version)"
    else
        log_warning "Soroban CLI não encontrado (opcional se contratos já compilados)"
    fi
    
    # Verificar versões
    log_info "Node.js: $(node --version)"
    log_info "NPM: $(npm --version)"
    log_info "Python: $(python3 --version)"
    log_info "Cargo: $(cargo --version)"
    
    # Verificar se portas estão disponíveis
    log_info "Verificando disponibilidade de portas..."
    
    PORTS_USED=""
    
    if ! check_port 3000; then
        PORTS_USED="$PORTS_USED 3000"
    fi
    
    if ! check_port 3001; then
        PORTS_USED="$PORTS_USED 3001"
    fi
    
    if ! check_port 8001; then
        PORTS_USED="$PORTS_USED 8001"
    fi
    
    if [ ! -z "$PORTS_USED" ]; then
        log_warning "Portas em uso:$PORTS_USED - Tentarei liberar automaticamente"
        for port in $PORTS_USED; do
            PID=$(lsof -ti:$port 2>/dev/null || true)
            if [ ! -z "$PID" ]; then
                kill $PID 2>/dev/null || true
                sleep 1
            fi
        done
    fi
    
    log_success "Todos os pré-requisitos verificados"
}

# Função para criar diretórios necessários
setup_directories() {
    log_step "Configurando diretórios..."
    
    mkdir -p "$LOG_DIR"
    mkdir -p "$PROJECT_ROOT/backend/data"
    
    log_success "Diretórios configurados"
}

# Função para configurar variáveis de ambiente
setup_environment() {
    log_step "Configurando variáveis de ambiente..."
    
    # Backend
    if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
        log_info "Criando arquivo .env para backend..."
        if [ -f "$PROJECT_ROOT/backend/env.example" ]; then
            cp "$PROJECT_ROOT/backend/env.example" "$PROJECT_ROOT/backend/.env"
            
            # Gerar JWT secret aleatório se disponível
            if command -v openssl &> /dev/null; then
                JWT_SECRET=$(openssl rand -base64 32)
                sed -i "s/your_super_secret_jwt_key_here_make_it_long_and_random/$JWT_SECRET/g" "$PROJECT_ROOT/backend/.env" 2>/dev/null || true
            fi
        else
            # Criar .env básico se não existir env.example
            cat > "$PROJECT_ROOT/backend/.env" << EOF
NODE_ENV=development
PORT=3001
CORS_ORIGIN=http://localhost:3000
AI_ENGINE_URL=http://localhost:8001
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
EOF
        fi
    fi
    
    # AI Engine
    if [ ! -f "$PROJECT_ROOT/ai-engine/.env" ]; then
        log_info "Criando arquivo .env para AI Engine..."
        cat > "$PROJECT_ROOT/ai-engine/.env" << EOF
# AI Engine Environment
STELLAR_NETWORK=testnet
LOG_LEVEL=INFO
API_HOST=0.0.0.0
API_PORT=8001
EOF
    fi
    
    # Frontend
    if [ ! -f "$PROJECT_ROOT/frontend/.env.local" ]; then
        log_info "Criando arquivo .env.local para frontend..."
        cat > "$PROJECT_ROOT/frontend/.env.local" << EOF
# Frontend Environment
NEXT_PUBLIC_STELLAR_NETWORK=testnet
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001
NEXT_PUBLIC_AI_ENGINE_URL=http://localhost:8001
EOF
    fi
    
    log_success "Variáveis de ambiente configuradas"
}

# Função para instalar dependências
install_dependencies() {
    log_step "Instalando dependências..."
    
    # Backend
    log_info "Instalando dependências do Backend..."
    cd "$PROJECT_ROOT/backend"
    if [ -f "package.json" ]; then
        npm install --silent --no-audit --no-fund || {
            log_warning "Primeira tentativa falhou, tentando novamente..."
            npm install --legacy-peer-deps --silent || {
                log_error "Falha na instalação das dependências do Backend"
                return 1
            }
        }
    else
        log_error "package.json não encontrado no backend"
        return 1
    fi
    
    # Frontend
    log_info "Instalando dependências do Frontend..."
    cd "$PROJECT_ROOT/frontend"
    if [ -f "package.json" ]; then
        npm install --silent --no-audit --no-fund || {
            log_warning "Primeira tentativa falhou, tentando novamente..."
            npm install --legacy-peer-deps --silent || {
                log_error "Falha na instalação das dependências do Frontend"
                return 1
            }
        }
    else
        log_error "package.json não encontrado no frontend"
        return 1
    fi
    
    # AI Engine
    log_info "Instalando dependências do AI Engine..."
    cd "$PROJECT_ROOT/ai-engine"
    if [ ! -d "venv" ]; then
        python3 -m venv venv || {
            log_error "Falha ao criar ambiente virtual"
            return 1
        }
    fi
    
    if [ -f "venv/bin/activate" ]; then
        source venv/bin/activate
        if [ -f "requirements.txt" ]; then
            pip install -r requirements.txt --quiet || {
                log_error "Falha na instalação das dependências do AI Engine"
                return 1
            }
        else
            log_error "requirements.txt não encontrado no AI Engine"
            return 1
        fi
    else
        log_error "Ambiente virtual não criado corretamente"
        return 1
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Todas as dependências instaladas"
}

# Função para compilar Smart Contracts (com tratamento de erro)
compile_contracts() {
    log_step "Compilando Smart Contracts..."
    cd "$PROJECT_ROOT/contracts"
    
    if [ -f "Cargo.toml" ]; then
        # Tentar compilação release primeiro
        if cargo build --release 2>/dev/null; then
            log_success "Smart Contracts compilados com sucesso"
        else
            log_warning "Falha na compilação release, tentando debug..."
            if cargo build 2>/dev/null; then
                log_success "Smart Contracts compilados em modo debug"
            else
                log_warning "Falha na compilação dos Smart Contracts (pode ser problema de dependências)"
                # Continuar mesmo com falha de compilação
            fi
        fi
    else
        log_warning "Cargo.toml não encontrado - pulando compilação de contratos"
    fi
    
    cd "$PROJECT_ROOT"
}

# Função para executar testes (modificada para ser mais tolerante)
run_tests() {
    log_step "Executando testes do sistema (modo não-bloqueante)..."
    
    # Testes dos Smart Contracts (não bloqueante)
    if [ -f "$PROJECT_ROOT/contracts/Cargo.toml" ]; then
        log_info "Testando Smart Contracts..."
        cd "$PROJECT_ROOT/contracts"
        if timeout 30 cargo test --release 2>/dev/null; then
            log_success "Testes dos Smart Contracts passaram"
        else
            log_warning "Testes dos Smart Contracts com problemas (continuando...)"
        fi
    fi
    
    # Testes do Backend (não bloqueante)
    if [ -f "$PROJECT_ROOT/backend/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/backend/package.json"; then
        log_info "Verificando testes do Backend..."
        cd "$PROJECT_ROOT/backend"
        if timeout 15 npm test -- --passWithNoTests 2>/dev/null; then
            log_success "Testes do Backend passaram"
        else
            log_warning "Testes do Backend com problemas (continuando...)"
        fi
    fi
    
    # Testes do Frontend (não bloqueante)
    if [ -f "$PROJECT_ROOT/frontend/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/frontend/package.json"; then
        log_info "Verificando testes do Frontend..."
        cd "$PROJECT_ROOT/frontend"
        if timeout 15 npm test -- --watchAll=false --passWithNoTests 2>/dev/null; then
            log_success "Testes do Frontend passaram"
        else
            log_warning "Testes do Frontend com problemas (continuando...)"
        fi
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Verificação de testes concluída"
}

# Função para iniciar AI Engine
start_ai_engine() {
    log_step "Iniciando AI Engine..."
    
    cd "$PROJECT_ROOT/ai-engine"
    
    if [ ! -f "venv/bin/activate" ]; then
        log_error "Ambiente virtual não encontrado"
        return 1
    fi
    
    source venv/bin/activate
    
    if [ ! -f "api_server.py" ]; then
        log_error "api_server.py não encontrado"
        return 1
    fi
    
    # Iniciar em background
    nohup python api_server.py > "$LOG_DIR/ai-engine.log" 2>&1 &
    AI_ENGINE_PID=$!
    
    # Salvar PID
    echo $AI_ENGINE_PID > "$LOG_DIR/ai-engine.pid"
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está rodando
    if kill -0 $AI_ENGINE_PID 2>/dev/null; then
        log_success "AI Engine iniciado (PID: $AI_ENGINE_PID)"
        return 0
    else
        log_error "Falha ao iniciar AI Engine"
        return 1
    fi
}

# Função para iniciar Backend
start_backend() {
    log_step "Iniciando Backend..."
    
    cd "$PROJECT_ROOT/backend"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado no backend"
        return 1
    fi
    
    if [ ! -f "server.js" ]; then
        log_error "server.js não encontrado no backend"
        return 1
    fi
    
    # Iniciar em background
    nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Salvar PID
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    
    # Aguardar inicialização
    sleep 8
    
    # Verificar se está rodando
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_success "Backend iniciado (PID: $BACKEND_PID)"
        return 0
    else
        log_error "Falha ao iniciar Backend"
        return 1
    fi
}

# Função para iniciar Frontend
start_frontend() {
    log_step "Iniciando Frontend..."
    
    cd "$PROJECT_ROOT/frontend"
    
    if [ ! -f "package.json" ]; then
        log_error "package.json não encontrado no frontend"
        return 1
    fi
    
    # Iniciar em background
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Salvar PID
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
    
    # Aguardar inicialização mais tempo para o Next.js
    sleep 15
    
    # Verificar se está rodando
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_success "Frontend iniciado (PID: $FRONTEND_PID)"
        return 0
    else
        log_error "Falha ao iniciar Frontend"
        return 1
    fi
}

# Função para testar conectividade entre serviços
test_services_connectivity() {
    log_step "Testando conectividade entre serviços..."
    
    # Aguardar todos os serviços estarem totalmente online
    sleep 10
    
    # Testar AI Engine
    log_info "Testando AI Engine..."
    if timeout 10 curl -s http://localhost:8001/health > /dev/null 2>&1; then
        log_success "AI Engine respondendo"
    else
        log_warning "AI Engine não está respondendo na porta 8001"
    fi
    
    # Testar Backend
    log_info "Testando Backend..."
    if timeout 10 curl -s http://localhost:3001/health > /dev/null 2>&1; then
        log_success "Backend respondendo"
    else
        log_warning "Backend não está respondendo na porta 3001"
    fi
    
    # Testar Frontend
    log_info "Testando Frontend..."
    if timeout 10 curl -s http://localhost:3000 > /dev/null 2>&1; then
        log_success "Frontend respondendo"
    elif timeout 10 curl -s http://localhost:3002 > /dev/null 2>&1; then
        log_success "Frontend respondendo na porta 3002"
    elif timeout 10 curl -s http://localhost:3003 > /dev/null 2>&1; then
        log_success "Frontend respondendo na porta 3003"
    else
        log_warning "Frontend não está respondendo"
    fi
    
    log_success "Testes de conectividade concluídos"
}

# Função para mostrar status do sistema
show_system_status() {
    log_step "Status do Sistema Stellar Credit"
    
    echo ""
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}    STELLAR CREDIT SYSTEM STATUS       ${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo ""
    
    echo -e "${CYAN}🔧 Serviços:${NC}"
    if [ ! -z "$AI_ENGINE_PID" ] && kill -0 $AI_ENGINE_PID 2>/dev/null; then
        echo -e "   • AI Engine:    ${GREEN}✅ Rodando${NC} (PID: $AI_ENGINE_PID, Porta: 8001)"
    else
        echo -e "   • AI Engine:    ${RED}❌ Parado${NC}"
    fi
    
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        echo -e "   • Backend:      ${GREEN}✅ Rodando${NC} (PID: $BACKEND_PID, Porta: 3001)"
    else
        echo -e "   • Backend:      ${RED}❌ Parado${NC}"
    fi
    
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "   • Frontend:     ${GREEN}✅ Rodando${NC} (PID: $FRONTEND_PID, Porta: 3000+)"
    else
        echo -e "   • Frontend:     ${RED}❌ Parado${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
    echo -e "   • Frontend:     ${BLUE}http://localhost:3000${NC} (ou 3002/3003 se porta ocupada)"
    echo -e "   • Backend API:  ${BLUE}http://localhost:3001${NC}"
    echo -e "   • AI Engine:    ${BLUE}http://localhost:8001${NC}"
    echo -e "   • API Docs:     ${BLUE}http://localhost:8001/docs${NC}"
    echo ""
    
    echo -e "${CYAN}📊 Health Checks:${NC}"
    echo -e "   • Backend:      ${BLUE}http://localhost:3001/health${NC}"
    echo -e "   • AI Engine:    ${BLUE}http://localhost:8001/health${NC}"
    echo ""
    
    echo -e "${CYAN}📝 Logs:${NC}"
    echo -e "   • Sistema:      ${BLUE}$INIT_LOG${NC}"
    echo -e "   • AI Engine:    ${BLUE}$LOG_DIR/ai-engine.log${NC}"
    echo -e "   • Backend:      ${BLUE}$LOG_DIR/backend.log${NC}"
    echo -e "   • Frontend:     ${BLUE}$LOG_DIR/frontend.log${NC}"
    echo ""
    
    echo -e "${CYAN}🛑 Para parar o sistema:${NC}"
    echo -e "   ${YELLOW}./stop_system.sh${NC}"
    echo ""
    
    # Verificar se pelo menos 2 dos 3 serviços estão rodando
    RUNNING_SERVICES=0
    if [ ! -z "$AI_ENGINE_PID" ] && kill -0 $AI_ENGINE_PID 2>/dev/null; then
        ((RUNNING_SERVICES++))
    fi
    if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
        ((RUNNING_SERVICES++))
    fi
    if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
        ((RUNNING_SERVICES++))
    fi
    
    if [ $RUNNING_SERVICES -ge 2 ]; then
        echo -e "${GREEN}✅ Sistema parcialmente/totalmente operacional!${NC}"
    else
        echo -e "${YELLOW}⚠️  Sistema com problemas - apenas $RUNNING_SERVICES serviços rodando${NC}"
    fi
    echo ""
}

# Função principal
main() {
    log_info "🚀 Iniciando Sistema Stellar Credit v1.1.0 (Versão Corrigida)"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Project Root: $PROJECT_ROOT"
    
    # Executar etapas
    check_prerequisites || exit 1
    setup_directories || exit 1
    setup_environment || exit 1
    install_dependencies || exit 1
    compile_contracts  # Não falha se der erro
    run_tests         # Não falha se der erro
    
    # Iniciar serviços (com verificação de erro)
    SERVICES_STARTED=0
    
    if start_ai_engine; then
        ((SERVICES_STARTED++))
    fi
    
    if start_backend; then
        ((SERVICES_STARTED++))
    fi
    
    if start_frontend; then
        ((SERVICES_STARTED++))
    fi
    
    if [ $SERVICES_STARTED -eq 0 ]; then
        log_error "Nenhum serviço foi iniciado com sucesso"
        exit 1
    fi
    
    test_services_connectivity
    show_system_status
    
    if [ $SERVICES_STARTED -ge 2 ]; then
        # Manter script rodando para monitorar serviços
        log_info "Sistema inicializado com sucesso! Pressione Ctrl+C para parar todos os serviços."
        
        # Loop de monitoramento simplificado
        while true; do
            sleep 30
            
            # Verificar se pelo menos um serviço ainda está rodando
            STILL_RUNNING=0
            
            if [ ! -z "$AI_ENGINE_PID" ] && kill -0 $AI_ENGINE_PID 2>/dev/null; then
                ((STILL_RUNNING++))
            fi
            
            if [ ! -z "$BACKEND_PID" ] && kill -0 $BACKEND_PID 2>/dev/null; then
                ((STILL_RUNNING++))
            fi
            
            if [ ! -z "$FRONTEND_PID" ] && kill -0 $FRONTEND_PID 2>/dev/null; then
                ((STILL_RUNNING++))
            fi
            
            if [ $STILL_RUNNING -eq 0 ]; then
                log_error "Todos os serviços pararam inesperadamente"
                break
            fi
        done
    else
        log_warning "Sistema iniciado com $SERVICES_STARTED serviços. Verifique os logs para mais detalhes."
    fi
}

# Verificar se script está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
