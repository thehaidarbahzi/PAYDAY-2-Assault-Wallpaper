# PAYDAY 2 Assault Wallpaper for KDE Plasma 6

An animated KDE Shader Wallpaper inspired by the PAYDAY 2 **POLICE ASSAULT IN PROGRESS** banner. The shader, banner texture, and DIN 1451 Engschrift font are kept together in this repository.

## Features

- Centered PAYDAY-style banner with square corner brackets and the yellow warning triangle.
- Continuous scrolling title, with evenly spaced `///` separators.
- Uses the bundled DIN 1451 Engschrift font and a pre-rendered seven-space banner texture.
- Linear yellow flicker with a 1.5 second cycle.
- When a track is playing through KDE's MPRIS media controls, shows its full title followed by `/// MUSIC PLAY IN PROGRESS ///` and repeats without truncating the title.
- Uses media artwork as a fullscreen background at 25% intensity, scaled to the exact monitor area like KDE's **Scaled** mode and the banner tint is translucent over the art.

## Installation

### 1. Install KDE Shader Wallpaper

Install the [KDE Shader Wallpaper](https://github.com/y4my4my4m/kde-shader-wallpaper) Plasma wallpaper plugin. To enable live media titles and artwork, apply the included integration patch to a clean checkout of the matching upstream source before building it:

```bash
git clone https://github.com/y4my4my4m/kde-shader-wallpaper.git
cd kde-shader-wallpaper
git checkout d672455
git apply /path/to/payday2-assault-wallpaper/patches/kde-shader-wallpaper-media.patch
mkdir -p package/contents/ui/Resources
cp /path/to/payday2-assault-wallpaper/assets/DINEngschrift.ttf package/contents/ui/Resources/
./scripts/build.sh install
```

On Arch Linux, install the build dependencies first:

```bash
sudo pacman -S --needed base-devel cmake extra-cmake-modules qt6-base qt6-declarative qt6-multimedia libplasma pipewire libpipewire pkgconf kconfig ki18n kpackage
```

### 2. Install this banner

Clone this repository, then run:

```bash
./install.sh
```

The installer copies the shader, banner texture, and font into the current user's KDE Shader Wallpaper data directory, and adds the shader to its local library index. It does not need `sudo`.

### 3. Select it as the wallpaper

1. Right-click the desktop and open **Configure Desktop and Wallpaper**.
2. Select **Shader Wallpaper** as the wallpaper type.
3. Open its shader gallery and select **Payday2 Assault Centered** under **Imported**.
4. Keep the banner image channel enabled and set to `Resources/payday2-assault-banner-spaced-7.png` if it is not selected automatically.
5. Customize your render scale based on the text inside the banner (16:10 4k is 50% from my experience)

The plugin watches the shader file for changes. If the wallpaper was already open during installation, select the shader again or reload Plasma to make the new file visible.

## Development

### Edit the shader

Edit [`shaders/assault.frag`](shaders/assault.frag). It contains the banner layout, frame, triangle, flicker, artwork compositing, and scrolling behavior. The shader is copied to:

```text
~/.local/share/plasma/wallpapers/online.knowmad.shaderwallpaper/contents/ui/Shaders/Imported/Payday2_Assault_Centered.frag
```

Re-run `./install.sh` after editing, then use the wallpaper's shader reload or reselect it.

### Rebuild the banner texture

The included texture is generated from [`tools/make_banner.py`](tools/make_banner.py). Python Pillow is required. By default the script uses the bundled font and writes the bundled texture:

```bash
python3 -m pip install --user Pillow
python3 tools/make_banner.py
./install.sh
```

Use a different font or output path with `--font` and `--output`:

```bash
python3 tools/make_banner.py --font /path/to/DIN-1451-Engschrift.ttf
```

The media title itself is rasterized by the patched KDE Shader Wallpaper engine using the same bundled font.

### Modify the media integration

The optional patch adds MPRIS metadata access, a generated title texture, and album-art routing to the host engine. Apply it to the plugin source and rebuild with:

```bash
./scripts/build.sh install
```

Then install this repository's shader/assets with `./install.sh`.

## Repository layout

```text
assets/      Banner texture and DIN Engschrift font
patches/     Optional KDE Shader Wallpaper media integration
shaders/     Main GLSL fragment shader
tools/       Banner texture generator
install.sh   Installs shader and assets into the current user's plugin data
```

## Font

`assets/DINEngschrift.ttf` was supplied for this wallpaper and is bundled so the title texture and live track text use the same typeface. The embedded font metadata identifies Adobe Systems Incorporated as its copyright holder. Check the font's license before redistributing it outside your own use.
