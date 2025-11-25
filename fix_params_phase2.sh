#!/bin/bash

# Phase 2: Add await params and replace param usages

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
    echo "Processing phase 2: $file"
    
    # Use awk to process the file
    awk '
    BEGIN { in_function = 0; added_await = 0; }
    
    # Detect function with Promise params
    /export (async )?function (GET|POST|PUT|PATCH|DELETE)/ && /params: Promise</ {
      in_function = 1
      added_await = 0
      print
      next
    }
    
    # If in function and not yet added await, add it after opening brace and any immediate lines
    in_function == 1 && added_await == 0 && /^\s*\{?\s*(try|await connectDB|const)/ {
      # Print the line first
      print
      # Then add the await params line
      print "    const resolvedParams = await params;"
      added_await = 1
      in_function = 0
      next
    }
    
    # Replace params.xxx with resolvedParams.xxx, but skip the line that defines resolvedParams
    /params\./ && !/resolvedParams = await params/ && !/params: Promise</ {
      gsub(/\bparams\./, "resolvedParams.")
    }
    
    # Also handle destructuring like: const { id } = params;
    /const \{ [^}]+ \} = params;/ {
      sub(/= params;/, "= resolvedParams;")
    }
    
    # Print the line
    { print }
    ' "$file" > "$file.tmp" && mv "$file.tmp" "$file"
    
    echo "✓ Added await and replaced usages in $file"
  fi
done

echo "Phase 2 complete!"
