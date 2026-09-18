# Reforma da experiência do player

## Objetivo
Transformar `/player` em uma experiência mobile-first, imersiva e mais simples, sem alterar regras, dados salvos, RPCs, autosave, rolagens, mapa ou o painel operacional do mestre.

## Implementação

1. **Preferências individuais e som**
   - Criar preferências locais isoladas por `profile.id`: cor, intensidade visual, som e volume.
   - Aplicar a cor somente na raiz visual de `/player`, recalculando contraste de `--primary-foreground`.
   - Centralizar sons Web Audio curtos para navegação, confirmação, notificação, dados e transcendência; inicializar apenas após gesto.
   - Integrar o painel de dados ao mesmo controle, removendo o armazenamento de som paralelo sem perder compatibilidade.

2. **Novo shell do player**
   - Reduzir a navegação principal para Início, Personagem, Investigação e Mapa.
   - Usar barra compacta no desktop e navegação inferior com safe-area no mobile.
   - Abrir Dados em painel/modal sobre a tela atual, preservando histórico e visibilidade pública/privada.
   - Colocar preferências em modal próprio e adicionar transições curtas, foco correto e suporte a movimento reduzido.

3. **Início e investigação**
   - Criar cabeçalho de personagem com avatar, identidade, classe, trilha e NEX.
   - Exibir PV, PE e SAN em barras animadas, sessão atual em destaque e ações rápidas.
   - Organizar notificações e pistas recentes por prioridade.
   - Reunir Pistas, Documentos e Anotações dentro de Investigação com controle interno.

4. **Transcendência dirigida pelo mestre**
   - Adicionar “Liberar Transcendência” em cada player de `/players`, com confirmação e envio individual via `master_send_notification`.
   - Interceptar notificação não lida `TRANSCENDENCIA` em `/player` e mostrar experiência fullscreen acessível.
   - “Agora não” apenas fecha localmente; “Responder ao chamado” marca como lida e abre Personagem → Paranormal → Progressão com destaque.
   - Em prévia do mestre, não marcar como lida nem persistir preferências ou ficha.

5. **Criação e ficha**
   - Redesenhar o assistente existente sem alterar validações: progresso, instrução objetiva, regra rápida, pendências e revisão clara.
   - Consolidar a ficha em Visão geral, Treinamento, Combate e Paranormal, mantendo todos os controles existentes dentro desses grupos.
   - Permitir abertura programática de Paranormal/Progressão para o chamado de transcendência.

6. **Acabamento e validação**
   - Adicionar estilos exclusivos do player: superfícies escuras legíveis, textura e brilho sutis, modo Sóbrio/Paranormal e animações hierárquicas.
   - Validar login/preview, navegação, dados, investigação, mapa, preferências e transcendência em desktop e mobile.
   - Executar as verificações automáticas do projeto e corrigir erros encontrados, sem publicar.

## Compatibilidade e limites
- Nenhuma migração de banco ou mudança destrutiva.
- Nenhum novo poder mecânico é concedido pela notificação.
- O painel do mestre só recebe o novo comando por player.
- Todos os dados legados, modo livre, mapa, rolagens e autosave permanecem ativos.
