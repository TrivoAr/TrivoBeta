#!/usr/bin/env python3
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

def fix_file(filepath):
    """Fix async params in a file"""
    path = Path(filepath)
    if not path.exists():
        print(f"⏭️  Skip (not found): {filepath}")
        return False

    # Restore from backup if exists
    backup = Path(str(path) + '.bak')
    if backup.exists():
        content = backup.read_text(encoding='utf-8')
    else:
        content = path.read_text(encoding='utf-8')

    original = content

    # Step 1: Update params type to Promise
    content = re.sub(
        r'\{\s*params\s*\}\s*:\s*\{\s*params:\s*(\{[^}]+\})\s*\}',
        r'{ params }: { params: Promise<\1> }',
        content
    )

    # Step 2: Process line by line to add resolvedParams
    lines = content.split('\n')
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]
        result.append(line)

        # Check if this is an export function line
        if re.search(r'^\s*export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)', line):
            # Look at next 3 lines to see if it has Promise params
            next_context = '\n'.join(lines[i:min(i+4, len(lines))])
            if 'params: Promise<' in next_context:
                # Find the first line after opening brace
                j = i + 1
                while j < len(lines) and j < i + 10:
                    result.append(lines[j])
                    stripped = lines[j].strip()

                    # Found first actual code line (after try, await connectDB, etc.)
                    if stripped and not stripped.startswith('//') and not stripped.startswith('/*'):
                        if '{' in stripped:
                            j += 1
                            continue
                        if 'try' in stripped:
                            j += 1
                            continue
                        if 'await connectDB' in stripped or 'connectDB()' in stripped:
                            # Add resolvedParams after connectDB
                            indent = len(lines[j]) - len(lines[j].lstrip())
                            result.append(' ' * indent + 'const resolvedParams = await params;')
                            i = j
                            break
                        if 'const' in stripped or 'return' in stripped or 'if' in stripped:
                            # Add before this line
                            indent = len(lines[j]) - len(lines[j].lstrip())
                            result.insert(-1, ' ' * indent + 'const resolvedParams = await params;')
                            i = j - 1
                            break
                    j += 1
                if j >= i + 10 or j >= len(lines):
                    i += 1
                    continue

        i += 1

    content = '\n'.join(result)

    # Step 3: Replace params.xxx with resolvedParams.xxx
    lines = content.split('\n')
    result = []
    for line in lines:
        if 'params: Promise<' not in line and 'resolvedParams = await params' not in line:
            # Replace params.
            line = re.sub(r'(?<!\w)params\.(\w+)', r'resolvedParams.\1', line)
            # Replace const { xxx } = params;
            line = re.sub(r'=\s*params;', r'= resolvedParams;', line)
        result.append(line)

    content = '\n'.join(result)

    if content != original:
        path.write_text(content, encoding='utf-8')
        print(f"✅ Fixed: {filepath}")
        return True
    else:
        print(f"⏭️  No changes needed: {filepath}")
        return False

def main():
    print("Fixing API route files...\n")
    fixed = 0
    for filepath in files:
        if fix_file(filepath):
            fixed += 1

    print(f"\n✨ Fixed {fixed}/{len(files)} files")

if __name__ == "__main__":
    main()
