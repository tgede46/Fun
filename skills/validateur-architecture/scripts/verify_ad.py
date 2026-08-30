#!/usr/bin/env python3
"""
validateur-architecture — Script auto de vérification AD pour Fun.
Usage: python scripts/verify_ad.py [--project-root /path] [--json] [--ad AD-N]

Exemples:
  python scripts/verify_ad.py                    # tous les checks, output texte
  python scripts/verify_ad.py --ad AD-1,AD-5     # seulement les checks AD-1 et AD-5
  python scripts/verify_ad.py --json             # output JSON pour parsing
  python scripts/verify_ad.py --spec spec-3-2   # vérification alignement spec (AD-9)
"""

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Optional

# ── Project root ──────────────────────────────────────────────────────────────

def detect_project_root(start: Path) -> Path:
    """Walk up to find project root (contains package.json + src-tauri)."""
    current = start.resolve()
    for _ in range(10):
        if (current / "package.json").exists() and (current / "src-tauri").exists():
            return current
        if current == current.parent:
            break
        current = current.parent
    raise RuntimeError("Could not find project root (no package.json + src-tauri)")

# ── AD-1: snake_case commands ────────────────────────────────────────────────

def check_ad1(project_root: Path) -> list[dict]:
    """Vérifier que les commandes Tauri utilisent snake_case."""
    issues = []
    pattern = re.compile(r'invoke\(\s*["\']([^"\']+)["\']')

    # Chercher dans le frontend (Next.js / React)
    frontend_dirs = [
        project_root / "src",
        project_root / "app",
    ]
    for d in frontend_dirs:
        if not d.exists():
            continue
        for f in d.rglob("*.{ts,tsx,js,jsx}"):
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for m in pattern.finditer(content):
                cmd = m.group(1)
                if not re.match(r'^[a-z][a-z0-9_]*$', cmd):
                    issues.append({
                        "ad": "AD-1",
                        "severity": "violation",
                        "file": str(f.relative_to(project_root)),
                        "detail": f"Commande Tauri non snake_case: '{cmd}'",
                        "fix": f"Renommer en snake_case (ex: {cmd.replace('-', '_').replace(' ', '_').lower()})"
                    })

    return issues

# ── AD-2 + AD-3 + AD-4: HTTP / secrets / OpenRouter frontend ───────────────

def check_ad234(project_root: Path) -> list[dict]:
    """Vérifier qu'aucun appel HTTP / secret / OpenRouter ne fugue côté frontend."""
    issues = []
    frontend_dirs = [
        project_root / "src",
        project_root / "app",
        project_root / "components",
    ]

    # Patterns à détecter côté frontend
    forbidden_patterns = [
        (r'fetch\s*\(', "appel fetch() détecté"),
        (r'axios\.(get|post|put|delete|request)', "appel axios détecté"),
        (r'openrouter', "référence OpenRouter côté frontend"),
        (r'api[_-]?key\s*[:=]\s*["\'][^"\']+', "clé API potentielle côté frontend"),
        (r'token\s*[:=]\s*["\'][^"\']+', "token potentiel côté frontend"),
        (r'["\'](sk-(test|live)_[a-zA-Z0-9]{20,})["\']', "clé OpenAI/OpenRouter potentielle en clair"),
    ]

    for d in frontend_dirs:
        if not d.exists():
            continue
        for f in d.rglob("*.{ts,tsx,js,jsx}"):
            try:
                content = f.read_text(encoding="utf-8", errors="ignore")
            except Exception:
                continue
            for pattern, msg in forbidden_patterns:
                for m in re.finditer(pattern, content, re.IGNORECASE):
                    line_start = content[:m.start()].count('\n') + 1
                    issues.append({
                        "ad": "AD-2/3/4",
                        "severity": "violation",
                        "file": str(f.relative_to(project_root)),
                        "line": line_start,
                        "detail": msg,
                        "fix": "Déplacer l'appel ou le secret dans une commande Tauri Rust"
                    })

    return issues

# ── AD-5: Écritures sous .fun/ ──────────────────────────────────────────────

def check_ad5(project_root: Path) -> list[dict]:
    """Vérifier que les écritures Rust vont sous .fun/."""
    issues = []
    rust_dir = project_root / "src-tauri" / "src"
    if not rust_dir.exists():
        return issues

    # Chercher les appels fs::write, std::fs, etc.
    write_pattern = re.compile(r'(?:fs::write|std::fs::write|write_file|File::create)\s*\(\s*(.+?)\s*,\s*')

    for f in rust_dir.rglob("*.rs"):
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue
        for m in write_pattern.finditer(content):
            path_expr = m.group(1).strip()
            # Variable de type PathBuf/Path déjà connue comme étant dans .fun/ — skip
            if '.fun' in path_expr:
                continue
            # Si c'est un string literal (entre guillemets), vérifier le contenu
            if (path_expr.startswith('"') and path_expr.endswith('"')) or \
               (path_expr.startswith("'") and path_expr.endswith("'")):
                path_literal = path_expr[1:-1]
                if not path_literal.startswith('.fun/') and not path_literal.startswith('.fun\\'):
                    issues.append({
                        "ad": "AD-5",
                        "severity": "violation",
                        "file": str(f.relative_to(project_root)),
                        "detail": f"Écriture hors .fun/: '{path_literal}'",
                        "fix": f"Déplacer sous .fun/ (ex: .fun/{path_literal})"
                    })
            elif '&' in path_expr or 'PathBuf' in path_expr or 'path' in path_expr.lower():
                # Variable Rust — suspect mais pas certain ; on ne peut pas savoir statically
                pass  # trop de faux positifs — on délègue à l'oeil humain
            else:
                # Expression complexe — warning seulement
                issues.append({
                    "ad": "AD-5",
                    "severity": "suspect",
                    "file": str(f.relative_to(project_root)),
                    "detail": f"Écriture potentielle hors .fun/: {path_expr[:80]}",
                    "fix": "Vérifier que le path est sous project_root/.fun/"
                })

    return issues

# ── AD-7: Pas de blocage main thread ────────────────────────────────────────

def check_ad7(project_root: Path) -> list[dict]:
    """Vérifier les I/O potentiellement bloquants sans spawn_blocking."""
    issues = []
    rust_dir = project_root / "src-tauri" / "src"
    if not rust_dir.exists():
        return issues

    # Pattern: I/O dans une fonction async sans spawn_blocking visible
    io_functions = [
        r'fs::read\(',
        r'fs::write\(',
        r'fs::create_dir_all\(',
        r'std::fs::',
        r'reqwest::',
        r'http::',
    ]

    for f in rust_dir.rglob("*.rs"):
        try:
            content = f.read_text(encoding="utf-8", errors="ignore")
        except Exception:
            continue

        lines = content.split('\n')
        in_async_fn = False
        async_indent = None
        has_spawn_blocking = False

        for i, line in enumerate(lines, 1):
            # Detect entry into async fn
            if re.match(r'\s*async\s+fn\s+', line):
                in_async_fn = True
                async_indent = len(line) - len(line.lstrip())
                has_spawn_blocking = False
            elif in_async_fn:
                current_indent = len(line) - len(line.lstrip())
                # Sortie de la fonction async
                if current_indent <= async_indent and line.strip() and not line.strip().startswith('#'):
                    in_async_fn = False
                    continue

                # Detect spawn_blocking
                if 'spawn_blocking' in line:
                    has_spawn_blocking = True

                # Detect I/O calls
                for io_pat in io_functions:
                    if re.search(io_pat, line):
                        if not has_spawn_blocking and not line.strip().startswith('//'):
                            issues.append({
                                "ad": "AD-7",
                                "severity": "suspect",
                                "file": str(f.relative_to(project_root)),
                                "line": i,
                                "detail": f"I/O potentiel dans async fn sans spawn_blocking: {line.strip()[:80]}",
                                "fix": "Envelopper dans tokio::task::spawn_blocking(|| { ... })"
                            })
                        break

    return issues

# ── AD-8: Tests passent ──────────────────────────────────────────────────────

def check_ad8(project_root: Path) -> dict:
    """Exécuter cargo test et npm run build. Retourner status + output."""
    result = {"ad": "AD-8", "tests": {}, "build": {}}

    # Cargo test
    try:
        proc = subprocess.run(
            ["cargo", "test", "--manifest-path", str(project_root / "src-tauri" / "Cargo.toml"),
             "--", "--test-threads=1", "--nocapture"],
            capture_output=True, text=True, timeout=180, cwd=str(project_root)
        )
        result["tests"]["exit_code"] = proc.returncode
        result["tests"]["stdout"] = proc.stdout[-3000:] if proc.stdout else ""
        result["tests"]["stderr"] = proc.stderr[-3000:] if proc.stderr else ""
        result["tests"]["passed"] = proc.returncode == 0
    except subprocess.TimeoutExpired:
        result["tests"]["error"] = "timeout 180s"
    except FileNotFoundError:
        result["tests"]["error"] = "cargo non trouvé"
    except Exception as e:
        result["tests"]["error"] = str(e)

    # npm run build
    try:
        proc = subprocess.run(
            ["npm", "run", "build"],
            capture_output=True, text=True, timeout=180, cwd=str(project_root)
        )
        result["build"]["exit_code"] = proc.returncode
        result["build"]["stdout"] = proc.stdout[-3000:] if proc.stdout else ""
        result["build"]["stderr"] = proc.stderr[-3000:] if proc.stderr else ""
        result["build"]["passed"] = proc.returncode == 0
    except subprocess.TimeoutExpired:
        result["build"]["error"] = "timeout 180s"
    except FileNotFoundError:
        result["build"]["error"] = "npm non trouvé"
    except Exception as e:
        result["build"]["error"] = str(e)

    return result

# ── AD-9: Alignement spec ────────────────────────────────────────────────────

def check_ad9(project_root: Path, spec_slug: Optional[str] = None) -> list[dict]:
    """Vérifier l'alignement entre spec et implémentation."""
    issues = []

    if spec_slug:
        spec_path = project_root / "_bmad-output" / "implementation-artifacts" / f"spec-{spec_slug}.md"
        if not spec_path.exists():
            return [{"ad": "AD-9", "severity": "violation", "detail": f"Spec introuvable: {spec_path}"}]
        try:
            spec_content = spec_path.read_text(encoding="utf-8")
        except Exception as e:
            return [{"ad": "AD-9", "severity": "violation", "detail": f"Erreur lecture spec: {e}"}]
    else:
        # Chercher la spec la plus récente "in-progress" ou "ready-for-dev"
        impl_dir = project_root / "_bmad-output" / "implementation-artifacts"
        if not impl_dir.exists():
            return []
        specs = sorted(impl_dir.glob("spec-*.md"), key=lambda p: p.stat().st_mtime, reverse=True)
        if not specs:
            return []
        spec_path = specs[0]
        try:
            spec_content = spec_path.read_text(encoding="utf-8")
        except Exception:
            return []

    # Extraire les Acceptance Criteria de la spec
    ac_sections = re.findall(r'(?im)^###?\s*Acceptance Criteria.*?(?=\n###|\Z)', spec_content, re.DOTALL)
    ac_items = []
    for section in ac_sections:
        ac_items.extend(re.findall(r'^\s*[-*]\s+(.+)$', section, re.MULTILINE))

    if not ac_items:
        # Alternative: chercher les critères de réussite
        ac_items = re.findall(r'(?im)^\s*[-*]\s+.*critère.*$', spec_content)
        if not ac_items:
            ac_items = re.findall(r'(?im)^\s*[-*]\s+.*(?:doit|must|should).*$', spec_content)

    # Pour chaque AC, vérifier si le code l'implémente (heuristique basique)
    for ac in ac_items[:10]:  # limiter à 10 AC pour éviter le bruit
        ac_lower = ac.lower()
        keywords = set(re.findall(r'\b\w{4,}\b', ac_lower)) - {"the", "that", "this", "with", "from", "have", "been", "will", "can", "are"}

        found_in_code = False
        code_dirs = [project_root / "src", project_root / "src-tauri" / "src", project_root / "app"]
        for d in code_dirs:
            if not d.exists():
                continue
            for f in d.rglob("*.{ts,tsx,js,jsx,rs}"):
                try:
                    code = f.read_text(encoding="utf-8", errors="ignore").lower()
                except Exception:
                    continue
                # Vérifier si les mots-clés significatifs apparaissent
                matches = sum(1 for kw in keywords if kw in code)
                if matches >= max(1, len(keywords) // 2):
                    found_in_code = True
                    break
            if found_in_code:
                break

        if not found_in_code:
            issues.append({
                "ad": "AD-9",
                "severity": "suspect",
                "detail": f"AC non trouvé dans le code: {ac[:120]}",
                "fix": "Vérifier si l'AC est implémenté ou si la spec est à jour"
            })

    return issues

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="Vérification automatique AD pour Fun")
    parser.add_argument("--project-root", "-r", type=Path, help="Racine du projet (détecté automatiquement si omis)")
    parser.add_argument("--ad", type=str, help="Limite les checks à ces IDs (ex: AD-1,AD-5)")
    parser.add_argument("--spec", type=str, help="Slug de la spec pour vérification AD-9 (ex: 3-2-benchmark-hardening)")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--verbose", "-v", action="store_true", help="Plus de détails")
    args = parser.parse_args()

    try:
        project_root = args.project_root or Path.cwd()
        if not (project_root / "package.json").exists():
            project_root = detect_project_root(project_root)
    except RuntimeError as e:
        print(f"ERREUR: {e}", file=sys.stderr)
        sys.exit(1)

    # Déterminer quels checks exécuter
    ad_filter = set()
    if args.ad:
        for part in args.ad.split(","):
            part = part.strip().upper()
            if part.startswith("AD-"):
                ad_filter.add(part)
            elif part.isdigit():
                ad_filter.add(f"AD-{part}")

    results = {}

    if not ad_filter or "AD-1" in ad_filter:
        results["AD-1"] = check_ad1(project_root)

    if not ad_filter or ("AD-2/3/4" in ad_filter or "AD-2" in ad_filter or "AD-3" in ad_filter or "AD-4" in ad_filter):
        results["AD-2/3/4"] = check_ad234(project_root)

    if not ad_filter or "AD-5" in ad_filter:
        results["AD-5"] = check_ad5(project_root)

    if not ad_filter or "AD-7" in ad_filter:
        results["AD-7"] = check_ad7(project_root)

    if not ad_filter or "AD-8" in ad_filter:
        results["AD-8"] = check_ad8(project_root)

    if not ad_filter or "AD-9" in ad_filter:
        results["AD-9"] = check_ad9(project_root, args.spec)

    # Summary
    summary = {
        "project_root": str(project_root),
        "timestamp": __import__('datetime').datetime.now().isoformat(),
        "checks": {},
        "total_violations": 0,
        "total_suspects": 0,
        "total_conformes": 0,
    }

    for ad_id, issues in results.items():
        if isinstance(issues, dict):
            # AD-8 retourne un dict
            passed = issues.get("tests", {}).get("passed", False) and issues.get("build", {}).get("passed", False)
            summary["checks"][ad_id] = {
                "status": "conforme" if passed else "violation",
                "details": "tests et build passent" if passed else "échecs détectés"
            }
            if not passed:
                summary["total_violations"] += 1
            else:
                summary["total_conformes"] += 1
        else:
            violations = [i for i in issues if i.get("severity") == "violation"]
            suspects = [i for i in issues if i.get("severity") == "suspect"]
            summary["checks"][ad_id] = {
                "status": "violation" if violations else ("suspect" if suspects else "conforme"),
                "violations": len(violations),
                "suspects": len(suspects),
                "issues": issues[:20] if args.verbose else issues[:5],  # limiter la sortie
            }
            summary["total_violations"] += len(violations)
            summary["total_suspects"] += len(suspects)
            if not violations and not suspects:
                summary["total_conformes"] += 1

    if args.json:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
        if args.verbose:
            print(json.dumps(results, indent=2, ensure_ascii=False))
    else:
        # Output texte
        print(f"\n═══ Validateur Architecture Fun ═══")
        print(f"Projet: {project_root.name}")
        print(f"Checks: {', '.join(sorted(summary['checks'].keys()))}")
        print()

        for ad_id in sorted(summary["checks"].keys()):
            check = summary["checks"][ad_id]
            icon = {"conforme": "✅", "suspect": "⚠️", "violation": "❌"}.get(check["status"], "?")
            print(f"{icon} {ad_id}: {check['status'].upper()}")

            if ad_id in results and isinstance(results[ad_id], list) and results[ad_id]:
                for issue in results[ad_id][:5]:
                    if args.verbose or issue["severity"] == "violation":
                        loc = f"{issue['file']}"
                        if issue.get("line"):
                            loc += f":{issue['line']}"
                        print(f"   └─ {issue['severity'].upper()}: {loc}")
                        print(f"      {issue['detail']}")
                        if "fix" in issue:
                            print(f"      → {issue['fix']}")

        print()
        print(f"Récap: {summary['total_conformes']} conformes, {summary['total_suspects']} suspects, {summary['total_violations']} violations")
        print()

    # Exit code basé sur les violations
    if summary["total_violations"] > 0:
        sys.exit(1)
    sys.exit(0)

if __name__ == "__main__":
    main()
