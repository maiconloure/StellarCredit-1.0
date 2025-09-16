#!/bin/bash

# ========================================
# STELLAR CREDIT - SCRIPT DE INICIALIZAÇÃO COMPLETA
# ========================================
# Este script inicializa todo o sistema Stellar Credit com testes
# Autor: Sistema Stellar Credit
# Versão: 1.0.0
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
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        log_warning "Porta $1 já está em uso"
        return 1
    fi
    return 0
}

# Função para matar processo por PID
kill_process() {
    if [ ! -z "$1" ] && kill -0 $1 2>/dev/null; then
        log_info "Matando processo PID: $1"
        kill $1
        sleep 2
        if kill -0 $1 2>/dev/null; then
            kill -9 $1
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
    pkill -f "python.*api_server.py" || true
    pkill -f "node.*server.js" || true
    pkill -f "next.*dev" || true
    
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
    log_info "Soroban: $(soroban --version)"
    
    # Verificar se portas estão disponíveis
    log_info "Verificando disponibilidade de portas..."
    
    if ! check_port 3000; then
        log_error "Frontend (porta 3000) não disponível"
        exit 1
    fi
    
    if ! check_port 3001; then
        log_error "Backend (porta 3001) não disponível"
        exit 1
    fi
    
    if ! check_port 8001; then
        log_error "AI Engine (porta 8001) não disponível"
        exit 1
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
        cp "$PROJECT_ROOT/backend/env.example" "$PROJECT_ROOT/backend/.env"
        
        # Gerar JWT secret aleatório
        JWT_SECRET=$(openssl rand -base64 32)
        sed -i "s/your_super_secret_jwt_key_here_make_it_long_and_random/$JWT_SECRET/g" "$PROJECT_ROOT/backend/.env"
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
    npm install --silent
    
    # Frontend
    log_info "Instalando dependências do Frontend..."
    cd "$PROJECT_ROOT/frontend"
    npm install --silent
    
    # AI Engine
    log_info "Instalando dependências do AI Engine..."
    cd "$PROJECT_ROOT/ai-engine"
    if [ ! -d "venv" ]; then
        python3 -m venv venv
    fi
    source venv/bin/activate
    pip install -r requirements.txt --quiet
    
    # Smart Contracts
    log_info "Compilando Smart Contracts..."
    cd "$PROJECT_ROOT/contracts"
    cargo build --release
    
    cd "$PROJECT_ROOT"
    log_success "Todas as dependências instaladas"
}

# Função para executar testes
run_tests() {
    log_step "Executando testes do sistema..."
    
    # Testes dos Smart Contracts
    log_info "Testando Smart Contracts..."
    cd "$PROJECT_ROOT/contracts"
    if cargo test --release; then
        log_success "Testes dos Smart Contracts passaram"
    else
        log_warning "Alguns testes dos Smart Contracts falharam"
    fi
    
    # Testes do Backend (se existirem)
    if [ -f "$PROJECT_ROOT/backend/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/backend/package.json"; then
        log_info "Executando testes do Backend..."
        cd "$PROJECT_ROOT/backend"
        if npm test; then
            log_success "Testes do Backend passaram"
        else
            log_warning "Alguns testes do Backend falharam"
        fi
    fi
    
    # Testes do Frontend (se existirem)
    if [ -f "$PROJECT_ROOT/frontend/package.json" ] && grep -q '"test"' "$PROJECT_ROOT/frontend/package.json"; then
        log_info "Executando testes do Frontend..."
        cd "$PROJECT_ROOT/frontend"
        if npm test -- --watchAll=false; then
            log_success "Testes do Frontend passaram"
        else
            log_warning "Alguns testes do Frontend falharam"
        fi
    fi
    
    cd "$PROJECT_ROOT"
    log_success "Testes concluídos"
}

# Função para iniciar AI Engine
start_ai_engine() {
    log_step "Iniciando AI Engine..."
    
    cd "$PROJECT_ROOT/ai-engine"
    source venv/bin/activate
    
    # Iniciar em background
    nohup python api_server.py > "$LOG_DIR/ai-engine.log" 2>&1 &
    AI_ENGINE_PID=$!
    
    # Salvar PID
    echo $AI_ENGINE_PID > "$LOG_DIR/ai-engine.pid"
    
    # Aguardar inicialização
    sleep 3
    
    # Verificar se está rodando
    if kill -0 $AI_ENGINE_PID 2>/dev/null; then
        log_success "AI Engine iniciado (PID: $AI_ENGINE_PID)"
    else
        log_error "Falha ao iniciar AI Engine"
        exit 1
    fi
}

# Função para iniciar Backend
start_backend() {
    log_step "Iniciando Backend..."
    
    cd "$PROJECT_ROOT/backend"
    
    # Iniciar em background
    nohup npm run dev > "$LOG_DIR/backend.log" 2>&1 &
    BACKEND_PID=$!
    
    # Salvar PID
    echo $BACKEND_PID > "$LOG_DIR/backend.pid"
    
    # Aguardar inicialização
    sleep 5
    
    # Verificar se está rodando
    if kill -0 $BACKEND_PID 2>/dev/null; then
        log_success "Backend iniciado (PID: $BACKEND_PID)"
    else
        log_error "Falha ao iniciar Backend"
        exit 1
    fi
}

# Função para iniciar Frontend
start_frontend() {
    log_step "Iniciando Frontend..."
    
    cd "$PROJECT_ROOT/frontend"
    
    # Iniciar em background
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    FRONTEND_PID=$!
    
    # Salvar PID
    echo $FRONTEND_PID > "$LOG_DIR/frontend.pid"
    
    # Aguardar inicialização
    sleep 8
    
    # Verificar se está rodando
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        log_success "Frontend iniciado (PID: $FRONTEND_PID)"
    else
        log_error "Falha ao iniciar Frontend"
        exit 1
    fi
}

# Função para testar conectividade entre serviços
test_services_connectivity() {
    log_step "Testando conectividade entre serviços..."
    
    # Aguardar todos os serviços estarem totalmente online
    sleep 10
    
    # Testar AI Engine
    log_info "Testando AI Engine..."
    if curl -s http://localhost:8001/health > /dev/null; then
        log_success "AI Engine respondendo"
    else
        log_error "AI Engine não está respondendo"
        return 1
    fi
    
    # Testar Backend
    log_info "Testando Backend..."
    if curl -s http://localhost:3001/health > /dev/null; then
        log_success "Backend respondendo"
    else
        log_error "Backend não está respondendo"
        return 1
    fi
    
    # Testar Frontend
    log_info "Testando Frontend..."
    if curl -s http://localhost:3000 > /dev/null; then
        log_success "Frontend respondendo"
    else
        log_error "Frontend não está respondendo"
        return 1
    fi
    
    # Testar integração Backend -> AI Engine
    log_info "Testando integração Backend -> AI Engine..."
    INTEGRATION_TEST=$(curl -s -X POST http://localhost:3001/api/demo/user/good_payer 2>/dev/null || echo "FAILED")
    if [[ $INTEGRATION_TEST != "FAILED" ]]; then
        log_success "Integração Backend -> AI Engine funcionando"
    else
        log_warning "Integração Backend -> AI Engine com problemas"
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
    echo -e "   • AI Engine:    ${GREEN}✅ Rodando${NC} (PID: $AI_ENGINE_PID, Porta: 8001)"
    echo -e "   • Backend:      ${GREEN}✅ Rodando${NC} (PID: $BACKEND_PID, Porta: 3001)"
    echo -e "   • Frontend:     ${GREEN}✅ Rodando${NC} (PID: $FRONTEND_PID, Porta: 3000)"
    echo -e "   • Contracts:    ${GREEN}✅ Compilados${NC}"
    echo ""
    
    echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
    echo -e "   • Frontend:     ${BLUE}http://localhost:3000${NC}"
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
    
    echo -e "${GREEN}✅ Sistema totalmente operacional!${NC}"
    echo ""
}

# Função principal
main() {
    log_info "🚀 Iniciando Sistema Stellar Credit v1.0.0"
    log_info "Timestamp: $TIMESTAMP"
    log_info "Project Root: $PROJECT_ROOT"
    
    # Executar etapas
    check_prerequisites
    setup_directories
    setup_environment
    install_dependencies
    run_tests
    start_ai_engine
    start_backend
    start_frontend
    test_services_connectivity
    show_system_status
    
    # Manter script rodando para monitorar serviços
    log_info "Sistema inicializado com sucesso! Pressione Ctrl+C para parar todos os serviços."
    
    # Loop de monitoramento
    while true; do
        sleep 30
        
        # Verificar se serviços ainda estão rodando
        if ! kill -0 $AI_ENGINE_PID 2>/dev/null; then
            log_error "AI Engine parou inesperadamente"
            break
        fi
        
        if ! kill -0 $BACKEND_PID 2>/dev/null; then
            log_error "Backend parou inesperadamente"
            break
        fi
        
        if ! kill -0 $FRONTEND_PID 2>/dev/null; then
            log_error "Frontend parou inesperadamente"
            break
        fi
    done
}

# Verificar se script está sendo executado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
