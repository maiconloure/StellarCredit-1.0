#!/bin/bash

# Script para testar funcionalidades em tempo real do Stellar Credit
# Executa testes automatizados para verificar se o sistema funciona corretamente

echo "🚀 Testando Sistema de Tempo Real - Stellar Credit"
echo "=================================================="

# Função para verificar se um processo está rodando
check_process() {
    if pgrep -f "$1" > /dev/null; then
        echo "✅ $2 está rodando"
        return 0
    else
        echo "❌ $2 não está rodando"
        return 1
    fi
}

# Função para testar endpoint HTTP
test_endpoint() {
    local url=$1
    local name=$2
    
    if curl -s "$url" > /dev/null; then
        echo "✅ $name responde corretamente"
        return 0
    else
        echo "❌ $name não está respondendo"
        return 1
    fi
}

# Função para testar WebSocket
test_websocket() {
    local url=$1
    local name=$2
    
    # Usar websocat se disponível, senão usar Node.js
    if command -v websocat &> /dev/null; then
        echo '{"type":"ping"}' | timeout 5s websocat "$url" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            echo "✅ $name WebSocket está funcionando"
            return 0
        else
            echo "❌ $name WebSocket não está respondendo"
            return 1
        fi
    else
        echo "⚠️  websocat não encontrado, pulando teste WebSocket"
        return 0
    fi
}

echo ""
echo "🔍 Verificando Processos..."
echo "----------------------------"

# Verificar se o backend está rodando
check_process "node.*server.js" "Backend (Node.js)"
backend_running=$?

# Verificar se o frontend está rodando
check_process "next.*dev" "Frontend (Next.js)"
frontend_running=$?

# Verificar se o AI Engine está rodando (opcional)
check_process "python.*api_server.py" "AI Engine (Python)"
ai_running=$?

echo ""
echo "🌐 Testando Endpoints HTTP..."
echo "-----------------------------"

# Testar backend
if [ $backend_running -eq 0 ]; then
    test_endpoint "http://localhost:3001/health" "Backend Health Check"
    test_endpoint "http://localhost:3001/api/ws/stats" "WebSocket Stats"
fi

# Testar frontend
if [ $frontend_running -eq 0 ]; then
    test_endpoint "http://localhost:3000" "Frontend Home"
fi

# Testar AI Engine
if [ $ai_running -eq 0 ]; then
    test_endpoint "http://localhost:8000/health" "AI Engine Health"
fi

echo ""
echo "🔌 Testando Conexões WebSocket..."
echo "--------------------------------"

# Testar WebSocket do backend
if [ $backend_running -eq 0 ]; then
    test_websocket "ws://localhost:3001/ws" "Backend"
fi

echo ""
echo "📦 Verificando Dependências..."
echo "------------------------------"

# Verificar dependências do backend
if [ -f "backend/package.json" ]; then
    cd backend
    if npm list ws &> /dev/null; then
        echo "✅ Dependência 'ws' instalada no backend"
    else
        echo "❌ Dependência 'ws' não encontrada no backend"
        echo "   Execute: cd backend && npm install"
    fi
    cd ..
else
    echo "❌ package.json do backend não encontrado"
fi

# Verificar se os arquivos principais existem
echo ""
echo "📁 Verificando Arquivos Principais..."
echo "------------------------------------"

files=(
    "backend/services/websocketService.js"
    "frontend/src/services/websocketService.ts"
    "frontend/src/hooks/useRealtimeWallet.ts"
    "frontend/src/components/RealtimeStatus.tsx"
    "frontend/src/pages/dashboard.tsx"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file existe"
    else
        echo "❌ $file não encontrado"
    fi
done

echo ""
echo "🧪 Teste de Integração Simples..."
echo "---------------------------------"

# Teste básico de conectividade
if [ $backend_running -eq 0 ] && [ $frontend_running -eq 0 ]; then
    echo "✅ Backend e Frontend rodando - Sistema pronto para teste"
    echo ""
    echo "🎯 Como testar manualmente:"
    echo "1. Abra http://localhost:3000"
    echo "2. Conecte uma carteira Stellar"
    echo "3. Observe o indicador de tempo real"
    echo "4. Verifique o dashboard em /dashboard"
    echo "5. Monitore os logs do backend para WebSocket"
    
elif [ $backend_running -eq 0 ]; then
    echo "⚠️  Apenas Backend rodando"
    echo "   Inicie o frontend: cd frontend && npm run dev"
    
elif [ $frontend_running -eq 0 ]; then
    echo "⚠️  Apenas Frontend rodando"
    echo "   Inicie o backend: cd backend && npm run dev"
    
else
    echo "❌ Nenhum serviço rodando"
    echo ""
    echo "🚀 Para iniciar o sistema:"
    echo "1. Terminal 1: cd backend && npm run dev"
    echo "2. Terminal 2: cd frontend && npm run dev"
    echo "3. Terminal 3 (opcional): cd ai-engine && python api_server.py"
fi

echo ""
echo "📊 Monitoramento em Tempo Real..."
echo "--------------------------------"

if [ $backend_running -eq 0 ]; then
    echo "🔍 Logs do WebSocket:"
    echo "   tail -f logs/backend.log | grep WebSocket"
    echo ""
    echo "📈 Estatísticas WebSocket:"
    echo "   curl http://localhost:3001/api/ws/stats | jq"
fi

echo ""
echo "🎉 Teste concluído!"
echo ""

# Resumo final
total_checks=8
passed_checks=0

[ $backend_running -eq 0 ] && ((passed_checks++))
[ $frontend_running -eq 0 ] && ((passed_checks++))

if [ $passed_checks -eq 2 ]; then
    echo "🟢 Status: SISTEMA OPERACIONAL (${passed_checks}/${total_checks} serviços)"
elif [ $passed_checks -eq 1 ]; then
    echo "🟡 Status: PARCIALMENTE OPERACIONAL (${passed_checks}/${total_checks} serviços)"
else
    echo "🔴 Status: INOPERANTE (${passed_checks}/${total_checks} serviços)"
fi

echo ""
echo "📚 Documentação: REALTIME_FEATURES.md"
echo "🐛 Em caso de problemas: verificar logs em ./logs/"
