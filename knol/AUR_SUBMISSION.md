# Submitting Lotion to AUR (Arch User Repository)

This guide explains how to submit and maintain the Lotion package on AUR.

## Prerequisites

1. An AUR account: https://aur.archlinux.org/register
2. SSH key added to your AUR account
3. `git` and `base-devel` installed on your system

## Initial Submission

### 1. Generate .SRCINFO

After updating `PKGBUILD`, generate the `.SRCINFO` file:

```bash
makepkg --printsrcinfo > .SRCINFO
```

### 2. Clone AUR repository

```bash
git clone ssh://aur@aur.archlinux.org/lotion.git lotion-aur
cd lotion-aur
```

### 3. Copy files

```bash
cp ../PKGBUILD .
cp ../.SRCINFO .
```

### 4. Commit and push

```bash
git add PKGBUILD .SRCINFO
git commit -m "Initial commit: Lotion v1.0.0"
git push
```

## Updating the Package

### 1. Update PKGBUILD

When releasing a new version:

1. Update `pkgver` in `PKGBUILD`
2. Update `pkgrel` to `1` (reset for new version)
3. Update `sha256sums` with the new tarball checksum

To get the checksum:
```bash
curl -sL https://github.com/puneetsl/lotion/archive/refs/tags/v1.0.0.tar.gz | sha256sum
```

### 2. Test the build

```bash
makepkg -si
```

### 3. Generate new .SRCINFO

```bash
makepkg --printsrcinfo > .SRCINFO
```

### 4. Commit and push

```bash
cd lotion-aur
git add PKGBUILD .SRCINFO
git commit -m "Update to v1.0.x"
git push
```

## Package Naming Conventions

- **lotion**: For stable releases from tags/releases
- **lotion-git**: For building from the latest git master (optional, can be separate)
- **lotion-bin**: For pre-built binaries (optional, if providing pre-built packages)

## Testing Before Submission

```bash
# In the directory with PKGBUILD
makepkg -si

# Test the installed application
lotion

# Uninstall
sudo pacman -R lotion
```

## Maintenance

- Respond to comments on the AUR page
- Update the package when new versions are released
- Mark out-of-date packages when notified
- Keep dependencies up to date

## Helpful Commands

```bash
# Clean build artifacts
makepkg -c

# Check PKGBUILD for issues
namcap PKGBUILD

# Check built package
namcap lotion-*.pkg.tar.zst

# Update checksums automatically (for git packages)
updpkgsums
```

## Resources

- [AUR Submission Guidelines](https://wiki.archlinux.org/title/AUR_submission_guidelines)
- [PKGBUILD Reference](https://wiki.archlinux.org/title/PKGBUILD)
- [Creating Packages](https://wiki.archlinux.org/title/Creating_packages)

## Notes

- The current PKGBUILD uses system Electron to keep package size down
- Make sure to update the maintainer email in PKGBUILD before submission
- Consider creating both `lotion` (stable) and `lotion-git` (development) packages
- **IMPORTANT**: All assets (including `icon.png`) are included in the source tarball. Do NOT add separate source entries for icons or other assets. The PKGBUILD installs them from `assets/` directory within the extracted tarball.

## Troubleshooting

### 404 Error for icon.png

If you encounter an error like:
```
ERROR: Failure while downloading https://raw.githubusercontent.com/puneetsl/lotion/master/icon.png
```

This means the PKGBUILD has an incorrect `source=()` entry. The correct PKGBUILD should only have the tarball as a source:

```bash
source=("$pkgname-$pkgver.tar.gz::https://github.com/puneetsl/$pkgname/archive/refs/tags/v$pkgver.tar.gz")
```

**Do not** add icon.png or any other assets as separate sources. They are all included in the tarball and will be available in the `assets/` directory after extraction.
