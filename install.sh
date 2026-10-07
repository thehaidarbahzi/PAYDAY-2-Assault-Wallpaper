#!/usr/bin/env bash
# Install the PAYDAY shader and its resources into a user's Shader Wallpaper data.
set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TARGET="${SHADER_WALLPAPER_UI_DIR:-${HOME}/.local/share/plasma/wallpapers/online.knowmad.shaderwallpaper/contents/ui}"

usage() {
    cat <<'EOF'
Usage: ./install.sh [--target PLUGIN_CONTENTS_UI]

Install the PAYDAY shader and bundled assets into KDE Shader Wallpaper's
contents/ui directory. Set SHADER_WALLPAPER_UI_DIR to override the default.
EOF
}

while (($#)); do
    case "$1" in
        --target)
            [[ $# -ge 2 ]] || { usage >&2; exit 2; }
            TARGET="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo "Unknown option: $1" >&2
            usage >&2
            exit 2
            ;;
    esac
done

if [[ ! -d "$TARGET" || ! -f "$TARGET/shader_index.json" ]]; then
    echo "KDE Shader Wallpaper was not found at: $TARGET" >&2
    echo "Install the wallpaper plugin first, or pass its contents/ui path with --target." >&2
    exit 1
fi

SHADER_DEST="$TARGET/Shaders/Imported/Payday2_Assault_Centered.frag"
RESOURCE_DIR="$TARGET/Resources"
mkdir -p "$(dirname -- "$SHADER_DEST")" "$RESOURCE_DIR"
install -m 0644 "$SCRIPT_DIR/shaders/assault.frag" "$SHADER_DEST"
install -m 0644 "$SCRIPT_DIR/assets/payday2-assault-banner-spaced-7.png" \
    "$RESOURCE_DIR/payday2-assault-banner-spaced-7.png"
install -m 0644 "$SCRIPT_DIR/assets/DINEngschrift.ttf" "$RESOURCE_DIR/DINEngschrift.ttf"

python3 - "$TARGET/shader_index.json" <<'PY'
import json
import sys
from pathlib import Path

index_path = Path(sys.argv[1])
data = json.loads(index_path.read_text(encoding="utf-8"))
shader_path = "Shaders/Imported/Payday2_Assault_Centered.frag"
shaders = data.setdefault("shaders", [])
entry = next((item for item in shaders if item.get("shaderPath") == shader_path), None)
if entry is None:
    shaders.append({
        "author": "",
        "category": "Imported",
        "description": "PAYDAY 2 assault banner with optional MPRIS title and album art",
        "favorite": False,
        "hasBuffers": False,
        "id": "9e6100a7-a941-4af5-9151-c5e22538e54f",
        "likes": 0,
        "name": "Payday2 Assault Centered",
        "needsAudio": False,
        "needsTextures": True,
        "shaderPath": shader_path,
        "source": "local",
        "sourceId": "",
        "tags": ["payday", "banner", "mpris"],
        "thumbnailPath": "",
        "views": 0,
    })
index_path.write_text(json.dumps(data, indent=4, ensure_ascii=False) + "\n", encoding="utf-8")
PY

echo "Installed PAYDAY Assault Banner."
echo "Shader:   $SHADER_DEST"
echo "Texture:  $RESOURCE_DIR/payday2-assault-banner-spaced-7.png"
echo "Font:     $RESOURCE_DIR/DINEngschrift.ttf"
echo "Select 'Payday2 Assault Centered' in the Shader Wallpaper gallery."
