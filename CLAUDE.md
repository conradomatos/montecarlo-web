# CLAUDE.md — Deploy montecarlo.conradomatos.dev

## Contexto
Este é um projeto Next.js (React + TypeScript) que precisa ser publicado em:
- **Domínio:** montecarlo.conradomatos.dev
- **Servidor:** VPS 82.25.79.220 via Coolify
- **Build:** Dockerfile já existe na raiz

## Tarefas (execute na ordem)

### 1. Criar repo no GitHub
```bash
gh repo create montecarlo-web --public --source=. --remote=origin --push
```
Se `gh` não estiver instalado, use:
```bash
git remote add origin git@github.com:conradomatos/montecarlo-web.git
git branch -M main
git push -u origin main
```
Se o usuário do GitHub for diferente de `conradomatos`, pergunte antes.

### 2. Verificar build local
```bash
npm run build
```
Deve compilar sem erros. Se faltar dependência, instale.

### 3. Configurar no Coolify (instruções para o usuário)
Depois do push, o usuário precisa:
1. Acessar Coolify em http://82.25.79.220:8000
2. New Resource → Application → Docker → GitHub
3. Repository: montecarlo-web
4. Branch: main
5. Build Pack: Dockerfile
6. Port: 3000
7. Domain: montecarlo.conradomatos.dev
8. Enable HTTPS (Let's Encrypt)

### 4. DNS (se ainda não configurado)
No painel do domínio conradomatos.dev, adicionar:
```
Tipo: CNAME
Host: montecarlo
Valor: 82.25.79.220
```
Ou se for A record:
```
Tipo: A
Host: montecarlo
Valor: 82.25.79.220
```

## Arquivos do projeto
- `Dockerfile` — multi-stage build com standalone output
- `next.config.ts` — output: "standalone" habilitado
- `src/lib/monte-carlo.ts` — motor Monte Carlo (PERT, Triangular, Bernoulli)
- `src/app/page.tsx` — Home
- `src/app/simulador/page.tsx` — Dashboard interativo
- `src/app/resultados/page.tsx` — Memorial de cálculo
- `src/components/` — Header, Footer, ParamSlider

## Importante
- O build já foi testado e compila sem erros
- O app roda na porta 3000
- Standalone mode está habilitado (necessário pro Dockerfile)
- Não precisa de banco de dados — tudo roda no browser
