#!/bin/bash

# 🧪 Script de Teste do Sistema Stellar Credit
# Verifica se todos os componentes estão funcionando corretamente

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${PURPLE}"
    echo "╔══════════════════════════════════════════════════════════════════════╗"
    echo "║                    🧪 TESTE DO SISTEMA STELLAR CREDIT                ║"
    echo "╚══════════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
}

print_section() {
    echo ""
    echo -e "${CYAN}═══ $1 ═══${NC}"
}

# Função para testar URLs
test_url() {
    local url=$1
    local description=$2
    local expected_code=${3:-200}
    
    print_test "Testando $description ($url)"
    
    local response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response_code" -eq "$expected_code" ]; then
        print_success "$description está funcionando (HTTP $response_code)"
        return 0
    else
        print_fail "$description não está funcionando (HTTP $response_code)"
        return 1
    fi
}

# Função para testar API endpoints
test_api() {
    local url=$1
    local description=$2
    local method=${3:-GET}
    local data=${4:-""}
    
    print_test "Testando API: $description"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        local response=$(curl -s -X POST -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null || echo '{"error":"connection_failed"}')
    else
        local response=$(curl -s "$url" 2>/dev/null || echo '{"error":"connection_failed"}')
    fi
    
    if echo "$response" | grep -q '"error":"connection_failed"'; then
        print_fail "$description - Conexão falhou"
        return 1
    else
        print_success "$description - Resposta recebida"
        echo "   Response: ${response:0:100}..."
        return 0
    fi
}

# Função principal de teste
main() {
    print_header
    
    local total_tests=0
    local passed_tests=0
    
    # === TESTE DE SERVIÇOS BÁSICOS ===
    print_section "SERVIÇOS BÁSICOS"
    
    # Frontend
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3000" "Frontend (Next.js)"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Backend
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3001/health" "Backend API"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # AI Engine
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:8001/health" "AI Engine"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # === TESTE DE ASSETS ===
    print_section "ASSETS E RECURSOS"
    
    # Logo PNG
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3000/images/stellar-credit-logo.png" "Logo PNG"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Logo SVG
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3000/images/stellar-credit-logo.svg" "Logo SVG"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Favicon
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3000/favicon.ico" "Favicon"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Manifest PWA
    total_tests=$((total_tests + 1))
    if test_url "http://localhost:3000/manifest.json" "PWA Manifest"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # === TESTE DE APIs ===
    print_section "ENDPOINTS DA API"
    
    # Backend Health
    total_tests=$((total_tests + 1))
    if test_api "http://localhost:3001/health" "Backend Health Check"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # AI Engine Health  
    total_tests=$((total_tests + 1))
    if test_api "http://localhost:8001/health" "AI Engine Health Check"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # Score calculation (esperamos erro pois não tem endereço válido)
    total_tests=$((total_tests + 1))
    if test_api "http://localhost:3001/api/score/demo" "Score Demo Endpoint"; then
        passed_tests=$((passed_tests + 1))
    fi
    
    # === TESTE DE INTEGRAÇÃO ===
    print_section "INTEGRAÇÃO FRONTEND-BACKEND"
    
    # Teste se frontend consegue acessar assets
    total_tests=$((total_tests + 1))
    print_test "Verificando se frontend carrega completamente"
    local frontend_content=$(curl -s http://localhost:3000 | head -20)
    if echo "$frontend_content" | grep -q "Stellar Credit"; then
        print_success "Frontend carrega título corretamente"
        passed_tests=$((passed_tests + 1))
    else
        print_fail "Frontend não carrega título corretamente"
    fi
    
    # === VERIFICAÇÃO DE PROCESSOS ===
    print_section "VERIFICAÇÃO DE PROCESSOS"
    
    # Verificar processos Node.js
    total_tests=$((total_tests + 1))
    print_test "Verificando processos Node.js ativos"
    local node_processes=$(ps aux | grep -E "(node|nodemon)" | grep -v grep | wc -l)
    if [ "$node_processes" -gt 0 ]; then
        print_success "Encontrados $node_processes processos Node.js ativos"
        passed_tests=$((passed_tests + 1))
    else
        print_fail "Nenhum processo Node.js ativo encontrado"
    fi
    
    # Verificar processo Python (AI Engine)
    total_tests=$((total_tests + 1))
    print_test "Verificando processo Python (AI Engine)"
    local python_processes=$(ps aux | grep "python.*api_server.py" | grep -v grep | wc -l)
    if [ "$python_processes" -gt 0 ]; then
        print_success "AI Engine Python está ativo"
        passed_tests=$((passed_tests + 1))
    else
        print_fail "AI Engine Python não está ativo"
    fi
    
    # === RESULTADOS FINAIS ===
    print_section "RESULTADOS FINAIS"
    
    echo ""
    echo -e "${CYAN}Resumo dos Testes:${NC}"
    echo -e "  Total de Testes: ${YELLOW}$total_tests${NC}"
    echo -e "  Testes Aprovados: ${GREEN}$passed_tests${NC}"
    echo -e "  Testes Falharam: ${RED}$((total_tests - passed_tests))${NC}"
    
    local success_rate=$((passed_tests * 100 / total_tests))
    echo -e "  Taxa de Sucesso: ${YELLOW}$success_rate%${NC}"
    
    echo ""
    if [ "$passed_tests" -eq "$total_tests" ]; then
        echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM! Sistema 100% funcional!${NC}"
        echo ""
        echo -e "${CYAN}🌐 Acesse sua aplicação:${NC}"
        echo -e "  • Frontend: ${YELLOW}http://localhost:3000${NC}"
        echo -e "  • Backend API: ${YELLOW}http://localhost:3001${NC}"
        echo -e "  • AI Engine: ${YELLOW}http://localhost:8001${NC}"
        echo -e "  • Logo PNG: ${YELLOW}http://localhost:3000/images/stellar-credit-logo.png${NC}"
        echo ""
        return 0
    elif [ "$success_rate" -ge 80 ]; then
        echo -e "${YELLOW}⚠️  Sistema funcionando com algumas limitações ($success_rate% dos testes)${NC}"
        echo ""
        return 1
    else
        echo -e "${RED}❌ Sistema com problemas críticos ($success_rate% dos testes)${NC}"
        echo ""
        return 2
    fi
}

# Executar testes
main "$@"
