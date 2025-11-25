#!/bin/bash

# List of files to fix (excluding already fixed ones)
files=(
  "src/app/api/academias/[id]/editar/route.ts"
  "src/app/api/academias/[id]/eliminar/route.ts"
  "src/app/api/academias/[id]/grupos/route.ts"
  "src/app/api/academias/[id]/miembros/route.ts"
  "src/app/api/academias/[id]/miembros/[user_id]/route.ts"
  "src/app/api/academias/[id]/route.ts"
  "src/app/api/asistencias/grupo/[grupoId]/route.ts"
  "src/app/api/asistencias/historial/[grupoId]/route.ts"
  "src/app/api/bares/[id]/route.ts"
  "src/app/api/entrenamientos/[id]/route.ts"
  "src/app/api/favoritos/academias/[id]/route.ts"
  "src/app/api/favoritos/teamsocial/[id]/route.ts"
  "src/app/api/grupos/[id]/route.ts"
  "src/app/api/notificaciones/[id]/markAsRead/route.ts"
  "src/app/api/pagos/[id]/route.ts"
  "src/app/api/pagos/academia/[id]/route.ts"
  "src/app/api/pagos/status/[id]/route.ts"
  "src/app/api/profile/[id]/route.ts"
  "src/app/api/reviews/academia/[id]/route.ts"
  "src/app/api/social/[id]/route.ts"
  "src/app/api/social/[id]/pago/route.ts"
  "src/app/api/sponsors/[id]/route.ts"
  "src/app/api/subscriptions/[id]/route.ts"
  "src/app/api/team-social/[id]/route.ts"
  "src/app/api/test/check-payment/[miembroId]/route.ts"
  "src/app/api/tickets/verify/[code]/route.ts"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "Processing: $file"
    
    # Create backup
    cp "$file" "$file.bak"
    
    # Step 1: Change param type definitions to Promise
    # Match various param patterns and wrap them in Promise<>
    sed -i 's/{ params }: { params: { \([^}]*\) } }/{ params }: { params: Promise<{ \1 }> }/g' "$file"
    
    echo "✓ Updated type to Promise in $file"
  fi
done

echo "Phase 1 complete: Types updated to Promise"
