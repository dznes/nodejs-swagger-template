pnpm init
pnpm i fastify fastify-type-provider-zod @fastify/cors zod
pnpm i typescript @types/node tsx -D
pnpm tsc init

Repositório com as configurações do tsconfig de acordo com sua versão de NodeJS.
https://github.com/tsconfig/bases

Neste exemplo estamos utilizando o node20, pegar conteúdo e substituir conteúdo do tsconfig.json:

bases/node20.json
`
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "display": "Node 20",
  "_version": "20.1.0",

  "compilerOptions": {
    "lib": ["es2023"],
    "module": "node16",
    "target": "es2022",

    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node16"
  }
}
`

pnpm i @fastify/swagger @fastify/swagger-ui



## GITHUB
git add -A
git checkout -b {{BRANCH_NAME}}
git status
git commit -m

COMMAND TO SEE CHANGES AND MAKE MINOR CODE REVIEWS
y - stage this hunk
n - do not stage this hunk
q - quit; do not stage this hunk or any of the remaining ones
a - stage this hunk and all later hunks in the file
d - do not stage this hunk or any of the later hunks in the file
g - select a hunk to go to
/ - search for a hunk matching the given regex
j - leave this hunk undecided, see next undecided hunk
J - leave this hunk undecided, see next hunk
e - manually edit the current hunk
? - print help

``bash
git add -p 
``
