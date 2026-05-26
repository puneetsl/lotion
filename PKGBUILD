# Maintainer: Puneet S. Lamba <puneetsl@gmail.com>
#
# Binary package — extracts the official .deb produced by our
# build-and-release workflow rather than rebuilding from source. This
# is intentionally a -bin style PKGBUILD: it avoids running `npm
# install` (and pulling ~950 node packages) on the user's machine and
# guarantees the same artifact that ships in our GitHub release.

pkgname=lotion-bin
_pkgname=lotion
pkgver=1.6.0
pkgrel=1
pkgdesc="Unofficial Notion.so desktop client for Linux (prebuilt)"
arch=('x86_64' 'aarch64')
url="https://github.com/puneetsl/lotion"
license=('MIT')
provides=('lotion')
conflicts=('lotion')
# Electron runtime libs that the bundled Chromium needs at runtime.
depends=('gtk3' 'nss' 'libxss' 'libsecret' 'libnotify' 'alsa-lib' 'xdg-utils')
makedepends=('libarchive')

# Architecture-specific .deb produced by the GitHub release build.
source_x86_64=("$pkgname-$pkgver-x86_64.deb::$url/releases/download/v$pkgver/${_pkgname}_${pkgver}_amd64.deb")
source_aarch64=("$pkgname-$pkgver-aarch64.deb::$url/releases/download/v$pkgver/${_pkgname}_${pkgver}_arm64.deb")

# Run `updpkgsums` after bumping pkgver to lock these to the
# release-tagged artifact checksums. SKIP only for first-cut testing.
sha256sums_x86_64=('SKIP')
sha256sums_aarch64=('SKIP')

package() {
  cd "$srcdir"

  # The .deb is an ar archive containing control.tar.* and data.tar.*.
  # bsdtar (from libarchive, part of base-devel) reads both.
  local deb="$pkgname-$pkgver-${CARCH}.deb"
  bsdtar -x -f "$deb"
  bsdtar -x -C "$pkgdir" -f data.tar.*

  # The .deb already lays out files under the right system paths
  # (/opt/Lotion + /usr/share/{applications,icons}/...). Move the LICENSE
  # alongside other Arch-conventional locations if present.
  if [ -f "$pkgdir/opt/Lotion/LICENSE" ]; then
    install -Dm644 "$pkgdir/opt/Lotion/LICENSE" \
      "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  fi
}
