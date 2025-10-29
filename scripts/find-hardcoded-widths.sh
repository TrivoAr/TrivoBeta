#!/bin/bash

# Script para encontrar anchos hardcodeados en el código
# Útil para auditar el progreso de la refactorización responsive

echo "======================================"
echo " Auditoría de Anchos Hardcodeados"
echo "======================================"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Buscar w-[390px]
echo -e "${YELLOW}Buscando w-[390px]...${NC}"
W390_COUNT=$(grep -r "w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontradas: ${RED}$W390_COUNT${NC} ocurrencias"
if [ $W390_COUNT -gt 0 ]; then
  echo ""
  echo "Archivos afectados:"
  grep -r "w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -l 2>/dev/null | sed 's/^/  - /'
fi

echo ""
echo "--------------------------------------"
echo ""

# Buscar max-w-[390px]
echo -e "${YELLOW}Buscando max-w-[390px]...${NC}"
MAXW390_COUNT=$(grep -r "max-w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontradas: ${RED}$MAXW390_COUNT${NC} ocurrencias"
if [ $MAXW390_COUNT -gt 0 ]; then
  echo ""
  echo "Archivos afectados:"
  grep -r "max-w-\[390px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" -l 2>/dev/null | sed 's/^/  - /'
fi

echo ""
echo "--------------------------------------"
echo ""

# Buscar cualquier width hardcodeado con px
echo -e "${YELLOW}Buscando otros anchos hardcodeados (w-[XXXpx])...${NC}"
OTHER_W_COUNT=$(grep -r "w-\[[0-9]\+px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | grep -v "w-\[24px\]" | grep -v "w-\[32px\]" | grep -v "w-\[48px\]" | wc -l)
echo -e "Encontradas: ${YELLOW}$OTHER_W_COUNT${NC} ocurrencias (excluyendo iconos pequeños)"

echo ""
echo "--------------------------------------"
echo ""

# Buscar cualquier max-width hardcodeado con px
echo -e "${YELLOW}Buscando otros max-width hardcodeados...${NC}"
OTHER_MAXW_COUNT=$(grep -r "max-w-\[[0-9]\+px\]" src/ --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" 2>/dev/null | wc -l)
echo -e "Encontradas: ${YELLOW}$OTHER_MAXW_COUNT${NC} ocurrencias"

echo ""
echo "--------------------------------------"
echo ""

# Resumen
TOTAL=$(($W390_COUNT + $MAXW390_COUNT))
echo -e "${YELLOW}RESUMEN:${NC}"
echo -e "  Total de anchos 390px hardcodeados: ${RED}$TOTAL${NC}"
echo -e "  Otros anchos hardcodeados: ${YELLOW}$(($OTHER_W_COUNT + $OTHER_MAXW_COUNT))${NC}"

if [ $TOTAL -eq 0 ]; then
  echo ""
  echo -e "${GREEN}✅ ¡Excelente! No se encontraron anchos de 390px hardcodeados.${NC}"
else
  echo ""
  echo -e "${RED}❌ Aún quedan $TOTAL archivos por refactorizar.${NC}"
fi

echo ""
echo "======================================"
