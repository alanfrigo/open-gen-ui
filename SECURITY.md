# Segurança

OpenGenUI está em alpha e ainda não passou por auditoria de segurança. Não exponha uma instância pública com cadastro aberto e uma chave OpenRouter financiada antes de implementar cotas e controles de acesso apropriados.

Credenciais devem ficar em variáveis do servidor. Nunca use prefixos `NEXT_PUBLIC_` para segredos. Use HTTPS, buckets privados, credenciais restritas, backups e limites de corpo de requisição no proxy.

A aplicação verifica sessões e proprietário nas rotas de dados e arquivos. Skills são texto; não existe execução de scripts. Links assinados de arquivos duram 15 minutos e podem ser utilizados por quem receber o link durante esse período.

Ao encontrar uma vulnerabilidade, procure um canal privado do mantenedor do repositório onde esta distribuição foi publicada. Não publique credenciais nem detalhes exploráveis em issues públicas. Um contato oficial será definido antes da publicação do projeto.
