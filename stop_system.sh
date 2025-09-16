#!/bin/bash

# ========================================
# STELLAR CREDIT - SCRIPT PARA PARAR SISTEMA
# ========================================
# Este script para todos os serviços do Stellar Credit
# ========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

log_info() {
    echo -e "${CYAN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

log_success() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
}

# Função para matar processo por PID
kill_process_by_pid() {
    local pid_file="$1"
    local service_name="$2"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            log_info "Parando $service_name (PID: $pid)..."
            kill "$pid"
            sleep 3
            
            # Verificar se ainda está rodando
            if kill -0 "$pid" 2>/dev/null; then
                log_warning "Forçando parada de $service_name..."
                kill -9 "$pid"
            fi
            
            log_success "$service_name parado"
        else
            log_warning "$service_name não estava rodando"
        fi
        
        # Remover arquivo PID
        rm -f "$pid_file"
    else
        log_warning "Arquivo PID para $service_name não encontrado"
    fi
}

# Função para matar processos por nome
kill_process_by_name() {
    local process_pattern="$1"
    local service_name="$2"
    
    log_info "Procurando processos $service_name..."
    
    local pids=$(pgrep -f "$process_pattern" || true)
    if [ ! -z "$pids" ]; then
        log_info "Parando processos $service_name: $pids"
        echo "$pids" | xargs kill -TERM
        sleep 3
        
        # Verificar se ainda estão rodando
        local remaining_pids=$(pgrep -f "$process_pattern" || true)
        if [ ! -z "$remaining_pids" ]; then
            log_warning "Forçando parada de $service_name..."
            echo "$remaining_pids" | xargs kill -9
        fi
        
        log_success "$service_name parado"
    else
        log_info "$service_name não estava rodando"
    fi
}

main() {
    log_info "🛑 Parando Sistema Stellar Credit..."
    
    # Parar por arquivos PID primeiro
    kill_process_by_pid "$LOG_DIR/ai-engine.pid" "AI Engine"
    kill_process_by_pid "$LOG_DIR/backend.pid" "Backend"
    kill_process_by_pid "$LOG_DIR/frontend.pid" "Frontend"
    
    # Parar por nome de processo como backup
    kill_process_by_name "python.*api_server.py" "AI Engine"
    kill_process_by_name "node.*server.js" "Backend"
    kill_process_by_name "next.*dev" "Frontend"
    
    # Verificar portas
    log_info "Verificando se portas foram liberadas..."
    
    if ! lsof -Pi :3000 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Porta 3000 (Frontend) liberada"
    else
        log_warning "Porta 3000 ainda em uso"
    fi
    
    if ! lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Porta 3001 (Backend) liberada"
    else
        log_warning "Porta 3001 ainda em uso"
    fi
    
    if ! lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
        log_success "Porta 8001 (AI Engine) liberada"
    else
        log_warning "Porta 8001 ainda em uso"
    fi
    
    log_success "Sistema Stellar Credit parado com sucesso!"
    log_info "Para reiniciar, execute: ./init_system.sh"
}

# Executar função principal
main "$@"
