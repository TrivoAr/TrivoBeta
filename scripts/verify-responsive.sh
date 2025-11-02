#!/bin/bash

# Script de verificación post-refactorización
# Verifica que se estén usando las clases responsive correctas

echo "======================================"
echo " Verificación de Diseño Responsive"
echo "======================================"
echo ""

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Verificar uso de app-container
echo -e "${YELLOW}Verificando uso de app-container...${NC}"
APP_CONTAINER_COUNT=$(grep -r "app-container" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontrados: ${GREEN}$APP_CONTAINER_COUNT${NC} usos de app-container"

echo ""

# Verificar uso de max-w-app
echo -e "${YELLOW}Verificando uso de max-w-app...${NC}"
MAX_W_APP_COUNT=$(grep -r "max-w-app" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontrados: ${GREEN}$MAX_W_APP_COUNT${NC} usos de max-w-app"

echo ""

# Verificar uso de aspect-ratio
echo -e "${YELLOW}Verificando uso de aspect-ratio responsive...${NC}"
ASPECT_COUNT=$(grep -r "aspect-\[" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontrados: ${GREEN}$ASPECT_COUNT${NC} usos de aspect-ratio"

echo ""

# Verificar uso del componente AppContainer
echo -e "${YELLOW}Verificando uso del componente <AppContainer>...${NC}"
COMPONENT_COUNT=$(grep -r "<AppContainer" src/ --include="*.tsx" --include="*.jsx" 2>/dev/null | wc -l)
echo -e "Encontrados: ${GREEN}$COMPONENT_COUNT${NC} usos del componente AppContainer"

echo ""
echo "--------------------------------------"
echo ""

# Resumen de mejora
TOTAL_RESPONSIVE=$(($APP_CONTAINER_COUNT + $MAX_W_APP_COUNT + $COMPONENT_COUNT))
echo -e "${GREEN}✅ Total de implementaciones responsive: $TOTAL_RESPONSIVE${NC}"

echo ""
echo "======================================"
