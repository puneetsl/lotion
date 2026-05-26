# PKGBUILD — `lotion-bin`

Lotion is packaged for Arch Linux as a **binary package** (`lotion-bin`)
that extracts the official `.deb` produced by our GitHub Actions
release build. We do this instead of building from source for two
reasons:

1. **No `npm install` on the user's machine.** A source build pulls
   ~950 npm packages with the usual deprecation warnings and CVE
   chatter (this was the underlying complaint in #146).
2. **Same artifact as the official release.** Users get bit-for-bit
   the same binary that ships in our `.deb` / `.rpm` / `.zip` release
   assets.

## What the PKGBUILD does

The `package()` step is a few lines: extract the `.deb` (a standard
`ar` archive containing `control.tar.*` + `data.tar.*`) with `bsdtar`,
then extract `data.tar.*` straight into `$pkgdir`. The `.deb` already
lays files out under the right system paths (`/opt/Lotion/` for the
app, `/usr/share/applications/`, `/usr/share/icons/`, `/usr/bin/`),
so no further moves are needed.

## Building locally

```bash
git clone https://github.com/puneetsl/lotion.git
cd lotion
makepkg -si
```

`makepkg` will fetch the architecture-matching `.deb` from the latest
release and install it via pacman.

## Updating for a new release

1. Bump `pkgver` (and reset `pkgrel=1`) in `PKGBUILD`.
2. Wait for the GitHub release artifacts to be published (the
   build-and-release workflow runs automatically when a `v*` tag is
   pushed).
3. Lock the checksums:

   ```bash
   updpkgsums
   ```

4. Regenerate `.SRCINFO`:

   ```bash
   makepkg --printsrcinfo > .SRCINFO
   ```

5. Push to the AUR repo (see [`knol/AUR_SUBMISSION.md`](knol/AUR_SUBMISSION.md)).

## Why `-bin` and not a plain `lotion` package?

By AUR convention, `-bin` packages use prebuilt binaries while
plain-named packages build from source. We don't offer a source-build
PKGBUILD because:

- The Electron build is heavyweight (multi-GB intermediate state) and
  pulls a long npm dependency chain.
- The official `.deb` is already a tested artifact for every release.

If you really want to build from source, do it with `npm install &&
npm run package` directly out of the cloned repo.
