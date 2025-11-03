# Lotion PKGBUILD for AUR

This PKGBUILD is used to build and install Lotion on Arch Linux via the AUR (Arch User Repository).

## Important Notes

- **All assets are included in the source tarball**: The PKGBUILD downloads the complete source code tarball from GitHub releases, which includes all necessary files (icons, desktop files, etc.)
- **Do NOT add separate source entries**: All assets like `icon.png` are located in the `assets/` directory within the tarball and should NOT be added as separate URLs in the `source=()` array
- **.SRCINFO is generated, not committed**: The `.SRCINFO` file should be generated using `makepkg --printsrcinfo > .SRCINFO` before submitting to AUR. It's in `.gitignore` and not tracked in this repository.

## Building the Package

```bash
# Clone this repository or the AUR repository
git clone https://github.com/puneetsl/lotion.git
cd lotion

# Build and install
makepkg -si
```

## Generating .SRCINFO for AUR

Before submitting to AUR, generate the `.SRCINFO` file:

```bash
makepkg --printsrcinfo > .SRCINFO
```

## Troubleshooting

### Error: 404 downloading icon.png

If you see an error like:
```
ERROR: Failure while downloading https://raw.githubusercontent.com/puneetsl/lotion/master/icon.png
```

This means you're using an outdated or incorrect PKGBUILD. The correct PKGBUILD should **only** have the tarball as a source:

```bash
source=("$pkgname-$pkgver.tar.gz::https://github.com/puneetsl/$pkgname/archive/refs/tags/v$pkgver.tar.gz")
```

Make sure you're using the latest PKGBUILD from this repository.

## Submitting to AUR

For detailed instructions on submitting and maintaining this package on AUR, see [knol/AUR_SUBMISSION.md](knol/AUR_SUBMISSION.md).

## File Structure

When the tarball is extracted, the structure includes:
```
lotion-1.0.0/
├── assets/
│   ├── icon.png          # Main icon
│   ├── icons/            # Icon sizes (16x16, 32x32, etc.)
│   └── lotion.desktop    # Desktop entry file
├── src/                  # Source code
├── package.json
└── ...
```

All files are installed from this extracted directory structure.
