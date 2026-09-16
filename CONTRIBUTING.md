# Contribuindo com o OpenGenUI

Obrigado por ajudar a construir um estúdio criativo aberto.

## Desenvolvimento

1. Instale Node.js 22+ e execute `npm ci`.
2. Inicie a UI com `npm run dev`. Para backend, siga o README.
3. Crie uma branch com escopo claro.
4. Valide com `npm run typecheck`, `npm test`, `npm run test:e2e` e `npm run build`.
5. Execute `npm run format` antes de abrir o PR.

Explique no PR o problema, o comportamento final e os testes executados. Para mudanças visuais, inclua capturas desktop e mobile. Para banco, versione e revise migrações. Não execute gerações pagas em CI.

## Princípios

- Menos fricção para criar; controles avançados sem atrapalhar o primeiro uso.
- Estados de carregamento, erro e vazio fazem parte da funcionalidade.
- Nunca apresente demonstrações como resultados reais de IA.
- Credenciais permanecem no servidor; cada leitura e escrita privada precisa verificar o proprietário.
- Skills de terceiros são conteúdo não confiável, sem execução arbitrária.
- Prefira mudanças pequenas, documentação honesta e código fácil de manter.

Discussões técnicas devem ser respeitosas e focadas no trabalho. Relate bugs com passos para reprodução, ambiente e resultado esperado. Remova tokens, prompts privados e dados pessoais dos logs anexados.
