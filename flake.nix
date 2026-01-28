{
  description = "Patchwork Next: A malleable software environment for collaborative work";

  inputs = {
    command-utils.url = "git+https://codeberg.org/expede/nix-command-utils";
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixos-25.11";
  };

  outputs = {
    self,
    command-utils,
    flake-utils,
    nixpkgs,
  }:
    flake-utils.lib.eachDefaultSystem (system: let
      pkgs = import nixpkgs { inherit system; };

      nodejs = pkgs.nodejs_24;
      pnpm-pkg = pkgs.pnpm;
      pnpm' = "${pnpm-pkg}/bin/pnpm";

      asModule = command-utils.asModule.${system};
      cmd = command-utils.cmd.${system};
      pnpm = command-utils.pnpm.${system};

      pnpm-cfg = { pnpm = pnpm'; };

      menu = command-utils.commands.${system} [
        (pnpm.build pnpm-cfg)
        (pnpm.dev pnpm-cfg)
        (pnpm.install pnpm-cfg)
        (pnpm.test pnpm-cfg)
        (asModule {
          "clean" = cmd "Remove node_modules and dist" "rm -rf **/node_modules **/dist";
          "dev:tiny" = cmd "Start dev server (tiny-patchwork)" "${pnpm'} dev";
          "dev:gaios" = cmd "Start dev server for Gaios" "SITE=gaios ${pnpm'} dev";
          "dev:hive" = cmd "Start dev server for Hive" "SITE=hive ${pnpm'} dev";
          "format" = cmd "Format code" "${pnpm'} format";
          "format:check" = cmd "Check code formatting" "${pnpm'} format:check";
          "make:tool" = cmd "Create a new tool" "${pnpm'} make-tool";
          "preview" = cmd "Preview production build" "${pnpm'} preview";
          "publish:packages" = cmd "Publish packages" "${pnpm'} publish-packages";
          "tsc" = cmd "Run TypeScript compiler" "${pnpm'} tsc";
        })
      ];

    in {
      devShells.default = pkgs.mkShell {
        name = "Patchwork Next Dev Shell";

        nativeBuildInputs = [
          nodejs
          pkgs.eslint
          pkgs.nodePackages.vscode-langservers-extracted
          pkgs.prettierd
          pkgs.typescript
          pkgs.typescript-language-server
          pnpm-pkg
        ] ++ menu;

        shellHook = ''
          menu
        '';
      };

      formatter = pkgs.alejandra;
    });
}
