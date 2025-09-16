#!/bin/bash

# ===============================================
# 🛑 STELLAR CREDIT - PARADA COMPLETA
# ===============================================
# Script para encerrar todos os serviços do Stellar Credit

set -e

# === CORES ===
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# === CONFIGURAÇÕES ===
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$PROJECT_ROOT/logs"

print_step() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} ${1}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

echo -e "${CYAN}"
echo "🛑 STELLAR CREDIT - ENCERRANDO SERVIÇOS"
echo "========================================"
echo -e "${NC}"

print_step "Encerrando todos os serviços..."

# Função para encerrar serviço por PID
stop_service() {
    local service_name=$1
    local pid_file="$LOG_DIR/$service_name.pid"
    
    if [[ -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if kill -0 $pid 2>/dev/null; then
            kill $pid
            sleep 2
            if kill -0 $pid 2>/dev/null; then
                kill -9 $pid 2>/dev/null || true
            fi
            print_success "$service_name encerrado (PID: $pid)"
        else
            print_info "$service_name já estava parado"
        fi
        rm -f "$pid_file"
    else
        print_info "PID file para $service_name não encontrado"
    fi
}

# Encerrar serviços
stop_service "frontend"
stop_service "backend" 
stop_service "ai-engine"

# Encerrar processos por porta (fallback)
print_step "Verificando processos nas portas..."

for port in 3000 3001 8001; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [[ -n "$pid" ]]; then
        kill $pid 2>/dev/null || true
        print_success "Processo na porta $port encerrado"
    fi
done

# Encerrar processos Node.js relacionados ao projeto
print_step "Encerrando processos Node.js relacionados..."
pkill -f "stellar-credit" 2>/dev/null || true
pkill -f "next dev" 2>/dev/null || true

# Encerrar processos Python relacionados
print_step "Encerrando processos Python relacionados..."
pkill -f "api_server.py" 2>/dev/null || true
pkill -f "uvicorn" 2>/dev/null || true

print_success "Todos os serviços foram encerrados!"
print_info "Logs mantidos em: $LOG_DIR/"
echo ""
