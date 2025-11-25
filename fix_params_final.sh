#!/bin/bash

# Final comprehensive fix

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
  if [ -f "$file.bak" ]; then
    # Restore from backup
    cp "$file.bak" "$file"
  fi
done

# Now use Python for more reliable fixes
python3 << 'PYTHON'
import re
from pathlib import Path

files = [
    "src/app/api/academias/[id]/editar/route.ts",
    "src/app/api/academias/[id]/eliminar/route.ts",
    "src/app/api/academias/[id]/grupos/route.ts",
    "src/app/api/academias/[id]/miembros/route.ts",
    "src/app/api/academias/[id]/miembros/[user_id]/route.ts",
    "src/app/api/academias/[id]/route.ts",
    "src/app/api/asistencias/grupo/[grupoId]/route.ts",
    "src/app/api/asistencias/historial/[grupoId]/route.ts",
    "src/app/api/bares/[id]/route.ts",
    "src/app/api/entrenamientos/[id]/route.ts",
    "src/app/api/favoritos/academias/[id]/route.ts",
    "src/app/api/favoritos/teamsocial/[id]/route.ts",
    "src/app/api/grupos/[id]/route.ts",
    "src/app/api/notificaciones/[id]/markAsRead/route.ts",
    "src/app/api/pagos/[id]/route.ts",
    "src/app/api/pagos/academia/[id]/route.ts",
    "src/app/api/pagos/status/[id]/route.ts",
    "src/app/api/profile/[id]/route.ts",
    "src/app/api/reviews/academia/[id]/route.ts",
    "src/app/api/social/[id]/route.ts",
    "src/app/api/social/[id]/pago/route.ts",
    "src/app/api/sponsors/[id]/route.ts",
    "src/app/api/subscriptions/[id]/route.ts",
    "src/app/api/team-social/[id]/route.ts",
    "src/app/api/test/check-payment/[miembroId]/route.ts",
    "src/app/api/tickets/verify/[code]/route.ts",
]

for filepath in files:
    path = Path(filepath)
    if not path.exists():
        continue
        
    content = path.read_text(encoding='utf-8')
    
    # Step 1: Update type to Promise
    content = re.sub(
        r'\{\s*params\s*\}\s*:\s*\{\s*params:\s*(\{[^}]+\})\s*\}',
        r'{ params }: { params: Promise<\1> }',
        content
    )
    
    # Step 2: Find functions and add resolvedParams
    lines = content.split('\n')
    new_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        new_lines.append(line)
        
        # Check if this line is a function declaration with Promise params
        if re.search(r'export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)', line) and i + 1 < len(lines):
            # Check if next few lines contain params: Promise
            context = '\n'.join(lines[i:min(i+5, len(lines))])
            if 'params: Promise<' in context:
                # Look ahead to find the opening brace and first real line of code
                j = i + 1
                found_brace = False
                while j < len(lines) and j < i + 10:
                    if '{' in lines[j]:
                        found_brace = True
                        # Add lines until we hit a code line
                        while j < len(lines) and j < i + 15:
                            j += 1
                            if j >= len(lines):
                                break
                            next_line = lines[j].strip()
                            if next_line and not next_line.startswith('//') and not next_line.startswith('/*'):
                                # Check if resolvedParams line already exists
                                if 'resolvedParams = await params' not in '\n'.join(lines[i:j+5]):
                                    # Insert before this line
                                    indent = len(lines[j]) - len(lines[j].lstrip())
                                    await_line = ' ' * indent + 'const resolvedParams = await params;'
                                    new_lines.append(await_line)
                                break
                        break
                    j += 1
                i = j
                continue
        
        i += 1
    
    content = '\n'.join(new_lines)
    
    # Step 3: Replace params.xxx with resolvedParams.xxx
    # But not in the type definition or the resolvedParams line itself
    lines = content.split('\n')
    new_lines = []
    for line in lines:
        if 'params: Promise<' not in line and 'resolvedParams = await params' not in line:
            # Replace params. with resolvedParams.
            line = re.sub(r'(?<!\w)params\.(\w+)', r'resolvedParams.\1', line)
            # Also handle: const { xxx } = params;
            line = re.sub(r'= params;', r'= resolvedParams;', line)
        new_lines.append(line)
    
    content = '\n'.join(new_lines)
    
    path.write_text(content, encoding='utf-8')
    print(f"✓ Fixed: {filepath}")

print("\nAll API route files fixed!")
PYTHON

echo "Done!"
