#!/usr/bin/env bash

export check="\xE2\x9C\x94"
export cross="\xE2\x9D\x8C"
command=$1
if [[  ! $command =~ native|web ]]; then
	printf "\nSelect which version you would want to uninstall:\n\n"
	select command in web native
	do
		if [[ $command =~ native|web ]]; then
			echo $command
			break
		else
			echo "Please input 1 or 2"
		fi
	done
fi
uninstall_prep() {
  export install_dir
  export shortcut_dir
  export exec_dir

  local share_dir
  share_dir="/usr/share"

  if [[ -d ${share_dir}/lotion ]]; then
    install_dir="${share_dir}/lotion-$command"
    shortcut_dir="${share_dir}/applications"
    exec_dir="/usr/bin"
  else
    install_dir="$(pwd)/Lotion-$command"
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
if [[ $command == 'web' ]]; then
  shortcut_file=Lotion.desktop
else
  shortcut_file=Notion_native.desktop
fi

delete_files() {
  declare -a files
  files=("${shortcut_dir}/${shortcut_file}" "${exec_dir}/lotion-$command" "${exec_dir}/lotion_uninstall")

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
