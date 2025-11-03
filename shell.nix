let
  pkgs = import <nixpkgs> {};
in pkgs.mkShell {
  packages = with pkgs; [
    (vscode-with-extensions.override {
      vscode = vscodium; 
      vscodeExtensions = with vscode-extensions; [
        bbenoist.nix
        ecmel.vscode-html-css
        streetsidesoftware.code-spell-checker
        oderwat.indent-rainbow
        esbenp.prettier-vscode
        usernamehw.errorlens 
        carrie999.cyberpunk-2020
        bierner.comment-tagged-templates
        dbaeumer.vscode-eslint  
      ];
    })
  ];
}

