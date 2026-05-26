# Submitting Lotion to the AUR

This guide covers submitting and maintaining the `lotion-bin` package
on the Arch User Repository.

## Prerequisites

1. An AUR account: <https://aur.archlinux.org/register>
2. An SSH key registered on your AUR account
3. `git` + `base-devel` installed locally

## Initial submission

The repo's `PKGBUILD` is the source of truth — the AUR repo is just a
mirror of it plus an `.SRCINFO`.

```bash
# 1. From the lotion repo: regenerate the SRCINFO from PKGBUILD
cd /path/to/lotion
makepkg --printsrcinfo > .SRCINFO

# 2. Clone the empty AUR repo (replace lotion-bin with whatever
#    package name has been reserved — see "Package naming" below)
git clone ssh://aur@aur.archlinux.org/lotion-bin.git lotion-aur
cd lotion-aur

# 3. Copy the two files the AUR cares about
cp ../lotion/PKGBUILD .
cp ../lotion/.SRCINFO .

# 4. Commit and push
git add PKGBUILD .SRCINFO
git commit -m "Initial release: lotion-bin v1.6.0"
git push
```

## Updating for a new release

1. Tag the new version in the lotion repo (push `vX.Y.Z`). Wait for
   the GitHub Actions release build to finish — `lotion_X.Y.Z_amd64.deb`
   and `lotion_X.Y.Z_arm64.deb` must exist in the release assets
   before makepkg can fetch them.

2. In the lotion repo, update `PKGBUILD`:
   - Bump `pkgver`
   - Reset `pkgrel=1`
   - Lock checksums: `updpkgsums` (this fetches each .deb and writes
     real sha256 values; replaces the `SKIP` placeholders)

3. Regenerate `.SRCINFO`:

   ```bash
   makepkg --printsrcinfo > .SRCINFO
   ```

4. Test the build locally:

   ```bash
   makepkg -si
   lotion        # verify it runs
   sudo pacman -R lotion-bin   # clean up
   ```

5. Copy `PKGBUILD` + `.SRCINFO` into the AUR repo, commit, push:

   ```bash
   cd /path/to/lotion-aur
   cp ../lotion/PKGBUILD .
   cp ../lotion/.SRCINFO .
   git add PKGBUILD .SRCINFO
   git commit -m "Update to v1.6.0"
   git push
   ```

## Package naming

The packaged artifact is a prebuilt binary (extracted from our
official `.deb`), so it follows the AUR `-bin` convention:

- **`lotion-bin`** — prebuilt; what we publish.
- `lotion` (no suffix) — would imply a source build; we don't ship one.
- `lotion-git` — would build from `master`; we don't ship one either.

If a user really wants a source build, they can clone the repo and
run `npm install && npm run package` directly.

## Useful commands

```bash
# Check PKGBUILD for issues
namcap PKGBUILD

# Check the built package
namcap lotion-bin-*.pkg.tar.zst

# Clean build artifacts
makepkg -c

# Force-refresh checksums from the live release assets
updpkgsums
```

## Maintenance notes

- Watch the AUR comments page for breakage reports
- Mark out-of-date when notified (a user without push access can flag it)
- If Electron runtime deps change (gtk3, nss, etc.), update `depends=`
- The `.deb` build is owned by the project's GitHub Actions release
  workflow — if releases stop producing `lotion_X.Y.Z_amd64.deb`, the
  PKGBUILD source URL will 404

## Resources

- [AUR Submission Guidelines](https://wiki.archlinux.org/title/AUR_submission_guidelines)
- [PKGBUILD Reference](https://wiki.archlinux.org/title/PKGBUILD)
- [Creating Packages](https://wiki.archlinux.org/title/Creating_packages)
