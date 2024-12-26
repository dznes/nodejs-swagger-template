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