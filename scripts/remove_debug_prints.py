from pathlib import Path

FILES = [
    Path(r"c:\Users\diego\Documents\Compartidos\Proyectos - Dev\ONV2\src\main.py"),
    Path(r"c:\Users\diego\Documents\Compartidos\Proyectos - Dev\ONV2\src\training.py"),
    Path(r"c:\Users\diego\Documents\Compartidos\Proyectos - Dev\ONV2\src\functions.py"),
]


def remove_debug_prints(path: Path) -> bool:
    original = path.read_text(encoding="utf-8")
    lines = original.splitlines()
    cleaned_lines = []
    i = 0
    changed = False

    while i < len(lines):
        line = lines[i]
        if "print(" in line:
            statement_lines = [line]
            paren_depth = line.count("(") - line.count(")")
            i += 1
            while paren_depth > 0 and i < len(lines):
                statement_lines.append(lines[i])
                paren_depth += lines[i].count("(") - lines[i].count(")")
                i += 1

            statement_text = "\n".join(statement_lines)
            if "DEBUG" in statement_text or "scenario_tag" in statement_text:
                changed = True
                continue

            cleaned_lines.extend(statement_lines)
        else:
            cleaned_lines.append(line)
            i += 1

    if changed:
        path.write_text("\n".join(cleaned_lines) + "\n", encoding="utf-8")

    return changed


def main():
    for file_path in FILES:
        if not file_path.exists():
            print(f"File not found: {file_path}")
            continue

        if remove_debug_prints(file_path):
            print(f"Removed DEBUG prints from {file_path.name}")
        else:
            print(f"No DEBUG prints found in {file_path.name}")


if __name__ == "__main__":
    main()
