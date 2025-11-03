# Maintainer: Puneet Singh Ludu <your-email@example.com>
pkgname=lotion
pkgver=1.0.0
pkgrel=1
pkgdesc="Unofficial Notion.so Desktop app for Linux"
arch=('x86_64' 'aarch64')
url="https://github.com/puneetsl/lotion"
license=('custom')
depends=('electron' 'nodejs')
makedepends=('npm' 'git')
# NOTE: The source tarball includes all necessary files (assets, icons, etc.)
# Do not add separate source entries for icon.png or other assets
source=("$pkgname-$pkgver.tar.gz::https://github.com/puneetsl/$pkgname/archive/refs/tags/v$pkgver.tar.gz")
sha256sums=('SKIP')  # Update this with actual checksum after first release

prepare() {
  cd "$srcdir/$pkgname-$pkgver"

  # Install dependencies
  npm install --cache "$srcdir/npm-cache"
}

build() {
  cd "$srcdir/$pkgname-$pkgver"

  # Package the application
  npm run package
}

package() {
  cd "$srcdir/$pkgname-$pkgver"

  # Install application files
  install -dm755 "$pkgdir/usr/lib/$pkgname"
  cp -r out/lotion-linux-*/resources/app.asar "$pkgdir/usr/lib/$pkgname/"

  # Install desktop file
  install -Dm644 assets/lotion.desktop "$pkgdir/usr/share/applications/$pkgname.desktop"

  # Install icon (from assets/ directory in the source tarball)
  install -Dm644 assets/icon.png "$pkgdir/usr/share/pixmaps/$pkgname.png"
  for size in 16 32 48 64 128 256 512; do
    install -Dm644 "assets/icons/${size}x${size}.png" \
      "$pkgdir/usr/share/icons/hicolor/${size}x${size}/apps/$pkgname.png"
  done

  # Create executable wrapper
  install -dm755 "$pkgdir/usr/bin"
  cat > "$pkgdir/usr/bin/$pkgname" << 'EOF'
#!/bin/sh
exec electron /usr/lib/lotion/app.asar "$@"
EOF
  chmod +x "$pkgdir/usr/bin/$pkgname"

  # Install license
  install -Dm644 LICENSE "$pkgdir/usr/share/licenses/$pkgname/LICENSE" 2>/dev/null || true
}
