#!/bin/bash

# ========================================
# STELLAR CREDIT - SCRIPT DE VERIFICAÇÃO DO SISTEMA
# ========================================
# Este script verifica o status e saúde de todos os serviços
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

# Função para verificar se porta está em uso
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Porta em uso
    else
        return 1  # Porta livre
    fi
}

# Função para verificar health endpoint
check_health() {
    local url=$1
    local timeout=${2:-5}
    
    if curl -s --max-time $timeout "$url" > /dev/null 2>&1; then
        return 0  # Saudável
    else
        return 1  # Não saudável
    fi
}

# Função para verificar processo por PID
check_process_by_pid() {
    local pid_file=$1
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            return 0  # Processo rodando
        fi
    fi
    return 1  # Processo não rodando
}

# Função para obter informações de processo
get_process_info() {
    local pid_file=$1
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            echo "$pid"
        else
            echo "N/A"
        fi
    else
        echo "N/A"
    fi
}

# Função para verificar tamanho do arquivo de log
get_log_size() {
    local log_file=$1
    
    if [ -f "$log_file" ]; then
        local size=$(du -h "$log_file" | cut -f1)
        echo "$size"
    else
        echo "N/A"
    fi
}

# Função para obter últimas linhas do log
get_log_tail() {
    local log_file=$1
    local lines=${2:-5}
    
    if [ -f "$log_file" ]; then
        tail -n $lines "$log_file"
    else
        echo "Log file not found: $log_file"
    fi
}

# Função principal de verificação
main() {
    echo -e "${PURPLE}========================================${NC}"
    echo -e "${PURPLE}    STELLAR CREDIT SYSTEM CHECK        ${NC}"
    echo -e "${PURPLE}========================================${NC}"
    echo ""
    
    local all_healthy=true
    
    # Verificar AI Engine
    echo -e "${CYAN}🤖 AI Engine (Porta 8001):${NC}"
    
    if check_port 8001; then
        echo -e "   Status: ${GREEN}✅ Porta ativa${NC}"
        
        if check_health "http://localhost:8001/health" 10; then
            echo -e "   Health: ${GREEN}✅ Saudável${NC}"
        else
            echo -e "   Health: ${RED}❌ Não responde${NC}"
            all_healthy=false
        fi
    else
        echo -e "   Status: ${RED}❌ Porta inativa${NC}"
        all_healthy=false
    fi
    
    local ai_pid=$(get_process_info "$LOG_DIR/ai-engine.pid")
    echo -e "   PID: $ai_pid"
    
    local ai_log_size=$(get_log_size "$LOG_DIR/ai-engine.log")
    echo -e "   Log Size: $ai_log_size"
    echo ""
    
    # Verificar Backend
    echo -e "${CYAN}🔧 Backend (Porta 3001):${NC}"
    
    if check_port 3001; then
        echo -e "   Status: ${GREEN}✅ Porta ativa${NC}"
        
        if check_health "http://localhost:3001/health" 10; then
            echo -e "   Health: ${GREEN}✅ Saudável${NC}"
        else
            echo -e "   Health: ${RED}❌ Não responde${NC}"
            all_healthy=false
        fi
    else
        echo -e "   Status: ${RED}❌ Porta inativa${NC}"
        all_healthy=false
    fi
    
    local backend_pid=$(get_process_info "$LOG_DIR/backend.pid")
    echo -e "   PID: $backend_pid"
    
    local backend_log_size=$(get_log_size "$LOG_DIR/backend.log")
    echo -e "   Log Size: $backend_log_size"
    echo ""
    
    # Verificar Frontend
    echo -e "${CYAN}🌐 Frontend (Porta 3000):${NC}"
    
    if check_port 3000; then
        echo -e "   Status: ${GREEN}✅ Porta ativa${NC}"
        
        if check_health "http://localhost:3000" 10; then
            echo -e "   Health: ${GREEN}✅ Saudável${NC}"
        else
            echo -e "   Health: ${RED}❌ Não responde${NC}"
            all_healthy=false
        fi
    else
        echo -e "   Status: ${RED}❌ Porta inativa${NC}"
        all_healthy=false
    fi
    
    local frontend_pid=$(get_process_info "$LOG_DIR/frontend.pid")
    echo -e "   PID: $frontend_pid"
    
    local frontend_log_size=$(get_log_size "$LOG_DIR/frontend.log")
    echo -e "   Log Size: $frontend_log_size"
    echo ""
    
    # Verificar Smart Contracts
    echo -e "${CYAN}📄 Smart Contracts:${NC}"
    
    if [ -f "$PROJECT_ROOT/contracts/target/release/stellar_credit_contract.wasm" ]; then
        echo -e "   Build: ${GREEN}✅ Compilado${NC}"
    else
        echo -e "   Build: ${RED}❌ Não compilado${NC}"
        all_healthy=false
    fi
    echo ""
    
    # Teste de integração básico
    echo -e "${CYAN}🔗 Teste de Integração:${NC}"
    
    if check_health "http://localhost:3001/api/demo/user/good_payer" 15; then
        echo -e "   API Demo: ${GREEN}✅ Funcionando${NC}"
    else
        echo -e "   API Demo: ${RED}❌ Falha${NC}"
        all_healthy=false
    fi
    echo ""
    
    # Verificar arquivos de configuração
    echo -e "${CYAN}⚙️  Configuração:${NC}"
    
    if [ -f "$PROJECT_ROOT/backend/.env" ]; then
        echo -e "   Backend .env: ${GREEN}✅ Existe${NC}"
    else
        echo -e "   Backend .env: ${RED}❌ Não encontrado${NC}"
        all_healthy=false
    fi
    
    if [ -f "$PROJECT_ROOT/ai-engine/.env" ]; then
        echo -e "   AI Engine .env: ${GREEN}✅ Existe${NC}"
    else
        echo -e "   AI Engine .env: ${YELLOW}⚠️  Não encontrado${NC}"
    fi
    
    if [ -f "$PROJECT_ROOT/frontend/.env.local" ]; then
        echo -e "   Frontend .env.local: ${GREEN}✅ Existe${NC}"
    else
        echo -e "   Frontend .env.local: ${YELLOW}⚠️  Não encontrado${NC}"
    fi
    echo ""
    
    # Status final
    echo -e "${PURPLE}========================================${NC}"
    if [ "$all_healthy" = true ]; then
        echo -e "${GREEN}✅ SISTEMA TOTALMENTE OPERACIONAL${NC}"
        echo ""
        echo -e "${CYAN}🌐 URLs de Acesso:${NC}"
        echo -e "   • Frontend:     ${BLUE}http://localhost:3000${NC}"
        echo -e "   • Backend API:  ${BLUE}http://localhost:3001${NC}"
        echo -e "   • AI Engine:    ${BLUE}http://localhost:8001${NC}"
        echo -e "   • API Docs:     ${BLUE}http://localhost:8001/docs${NC}"
    else
        echo -e "${RED}❌ SISTEMA COM PROBLEMAS${NC}"
        echo -e "${YELLOW}Execute ./init_system.sh para inicializar o sistema${NC}"
    fi
    echo -e "${PURPLE}========================================${NC}"
    echo ""
}

# Função para mostrar logs
show_logs() {
    local service=$1
    local lines=${2:-20}
    
    case $service in
        "ai"|"ai-engine")
            echo -e "${CYAN}📋 Últimas $lines linhas do AI Engine:${NC}"
            get_log_tail "$LOG_DIR/ai-engine.log" $lines
            ;;
        "backend"|"api")
            echo -e "${CYAN}📋 Últimas $lines linhas do Backend:${NC}"
            get_log_tail "$LOG_DIR/backend.log" $lines
            ;;
        "frontend"|"ui")
            echo -e "${CYAN}📋 Últimas $lines linhas do Frontend:${NC}"
            get_log_tail "$LOG_DIR/frontend.log" $lines
            ;;
        "system"|"init")
            echo -e "${CYAN}📋 Logs de inicialização do sistema:${NC}"
            if ls "$LOG_DIR"/system_init_*.log 1> /dev/null 2>&1; then
                local latest_log=$(ls -t "$LOG_DIR"/system_init_*.log | head -n1)
                get_log_tail "$latest_log" $lines
            else
                echo "Nenhum log de inicialização encontrado"
            fi
            ;;
        *)
            echo -e "${RED}Serviço inválido. Use: ai, backend, frontend, ou system${NC}"
            exit 1
            ;;
    esac
}

# Verificar argumentos
if [ "$1" = "logs" ]; then
    show_logs "$2" "$3"
elif [ "$1" = "help" ] || [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    echo "Uso:"
    echo "  $0                    - Verificar status do sistema"
    echo "  $0 logs <serviço>     - Mostrar logs de um serviço"
    echo "  $0 logs <serviço> <n> - Mostrar últimas n linhas dos logs"
    echo ""
    echo "Serviços disponíveis: ai, backend, frontend, system"
else
    main "$@"
fi
