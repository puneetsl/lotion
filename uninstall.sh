#!/usr/bin/env bash

export check="\xE2\x9C\x94"
export cross="\xE2\x9D\x8C"

uninstall_prep() {
  export install_dir
  export shortcut_dir
  export exec_dir

  local share_dir
  share_dir="/usr/share"

  if [[ -d ${share_dir}/lotion ]]; then
    install_dir="${share_dir}/lotion"
    shortcut_dir="${share_dir}/applications"
    exec_dir="/usr/bin"
  else
    install_dir="$(pwd)/Lotion"
    shortcut_dir="$HOME/.local/share/applications"
    exec_dir="$HOME/.local/bin"
  fi
}

delete_directory() {
  if [[ -d "${install_dir}" ]]; then
    rm -Rf "${install_dir}" || exit
    echo -e "${check} ${install_dir} was successfully deleted."
  else
    echo -e "${cross} ${install_dir} directory was not found. Skipping."
  fi
}

delete_files() {
  declare -a files
  files=("${shortcut_dir}/Lotion.desktop" "${exec_dir}/lotion" "${exec_dir}/lotion_uninstall")

  for file in "${files[@]}"; do
    if [[ -f "${file}" ]]; then
      rm "${file}" || exit
      echo -e "${cross} ${file} was successfully deleted."
    else
      echo -e "${cross} ${file} was not found. Skipping."
    fi
  done
}

uninstall_prep
delete_directory
delete_files
