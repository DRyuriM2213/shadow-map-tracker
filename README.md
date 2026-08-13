# Berço Mestre

Quero criar uma aplicação web completa, funcional e profissional chamada:

“OPERAÇÃO BERÇO VAZIO — PAINEL DO MESTRE”

A aplicação será um sistema interativo para acompanhar uma campanha presencial de RPG de investigação paranormal em tempo real.

Não quero apenas um site de leitura, um documento digital, um fluxograma estático ou uma interface conceitual.

Quero um SISTEMA FUNCIONAL no qual o mestre consiga clicar nas decisões tomadas pelos jogadores e acompanhar exatamente o caminho seguido por eles.

Quando o mestre selecionar uma decisão, sala, ação, sucesso ou falha, o sistema deve:

1. Registrar automaticamente a escolha.

2. Atualizar o estado da campanha.

3. Mostrar o que acontece naquele caminho.

4. Mostrar todas as ações possíveis naquela situação.

5. Mostrar quais pistas podem ser encontradas.

6. Mostrar os testes que podem ser solicitados.

7. Mostrar o resultado de sucesso e falha.

8. Mostrar consequências imediatas.

9. Agendar consequências futuras.

10. Sugerir os próximos caminhos possíveis.

11. Esconder temporariamente rotas que deixaram de fazer sentido.

12. Permitir que o mestre volte atrás caso tenha clicado errado.

13. Salvar tudo automaticamente.

A versão inicial deve conter somente os dois primeiros dias da campanha.

Não criar acontecimentos dos Dias 3 e 4.

A estrutura do sistema, porém, deve permitir que novos dias, salas, pistas, eventos e ramificações sejam adicionados posteriormente pelo mestre.

==================================================

1. CONTEXTO DA CAMPANHA

==================================================

Nome da campanha:

OPERAÇÃO BERÇO VAZIO

Local principal:

Universidade Valença

Gênero:

Investigação paranormal, suspense, mistério, terror e conspiração.

Período inicial preparado:

DIA 1 — segunda-feira, 17 de agosto de 2026

DIA 2 — terça-feira, 18 de agosto de 2026

O objetivo dessa primeira parte da campanha é:

• apresentar a Universidade Valença;

• mostrar a universidade como um local aparentemente normal;

• permitir exploração livre;

• realizar o acidente obrigatório do refletor no auditório;

• permitir várias reações diferentes ao acidente;

• apresentar pistas de sabotagem;

• mostrar que a universidade tenta controlar a narrativa;

• permitir investigação de salas, sistemas, documentos e pessoas;

• terminar o Dia 2 com ao menos uma teoria forte ou direção concreta.

==================================================

2. JOGADORES E PERSONAGENS

==================================================

Cadastrar inicialmente os seguintes jogadores e personagens:

Guilherme → Augusto

Luiz → Sofia

Thaissa → Amelie

Andy → Percy

REGRAS IMPORTANTES:

Augusto, Sofia, Amelie e Percy são personagens de jogadores.

Eles não são NPCs.

O sistema nunca deve determinar automaticamente:

• o que eles falam;

• como eles reagem;

• o que eles pensam;

• em quem confiam;

• qual decisão tomam;

• se revelam ou escondem alguma informação.

Quando um personagem de jogador estiver envolvido em uma cena, mostrar apenas:

• contexto da situação;

• informações disponíveis;

• opções possíveis;

• testes possíveis;

• consequências de cada escolha.

Percy é o personagem da jogadora Andy.

Nunca tratar Andy como uma pessoa ou contato separado de Percy dentro da campanha.

Amelie é a personagem da jogadora Thaissa.

Nunca tratar Thaissa como NPC.

Augusto é personagem de Guilherme e também ocupa a função de diretor da Universidade Valença.

O site não deve obrigar Augusto a tomar nenhuma atitude. Quando uma cena envolver decisões do diretor, deve mostrar opções possíveis para Guilherme escolher.

Alice saiu da campanha.

Não utilizar Alice em nenhuma parte do sistema.

Quando for necessário mencionar a posição narrativa que poderá ser ocupada futuramente por outro jogador, usar somente:

“FILHO DO DIRETOR”

Criar também um espaço de personagem pendente:

Nome: Filho do Diretor

Jogador: ainda não definido

Status: personagem opcional / pendente

O mestre poderá editar esse personagem depois.

==================================================

3. TECNOLOGIAS E ARQUITETURA

==================================================

Criar a aplicação usando:

• React

• TypeScript

• Tailwind CSS

• shadcn/ui

• React Flow para o diagrama interativo

• Supabase para autenticação e salvamento

• localStorage como backup automático local

• Zustand ou Context API para controle do estado da campanha

A aplicação deve funcionar bem em computador e notebook.

O foco principal é desktop, porque será utilizada durante a sessão de RPG.

Também deve ser utilizável em tablet.

Toda a interface e todo o conteúdo devem estar em português do Brasil.

Não criar apenas uma demonstração visual.

Todos os botões, filtros, escolhas, salvamentos, retornos, pistas e mudanças de estado devem funcionar.

Não usar textos genéricos como “Lorem ipsum”.

Popular o sistema com todo o conteúdo inicial dos Dias 1 e 2 descrito neste prompt.

==================================================

4. IDENTIDADE VISUAL

==================================================

Criar uma estética original de investigação paranormal profissional.

Não copiar diretamente interfaces, símbolos, logotipos ou artes de obras existentes.

Visual desejado:

• fundo escuro;

• preto, vinho, vermelho profundo, bege de papel e cinza;

• documentos antigos;

• fichas investigativas;

• pequenos efeitos de ruído e textura;

• cartões com aparência de arquivo;

• linhas e conexões discretas;

• tipografia clara e fácil de ler;

• animações rápidas e elegantes;

• interface séria, não infantil;

• sem excesso de efeitos;

• alta legibilidade durante a sessão.

Cores das rotas:

AMARELO — exploração do campus e versão oficial

AZUL — auditório, acessos e estrutura

VERDE — conversas, documentos e histórico

ROXO — áreas restritas, pessoas e comportamento

VERMELHO — perigo, acidente, confronto e consequências graves

CINZA — contingência e falha segura

VERDE-CLARO — convergência e avanço da investigação

PRETO — segredo exclusivo do mestre

==================================================

5. TELA DE LOGIN

==================================================

Criar uma tela simples de acesso exclusivo do mestre.

Campos:

• e-mail

• senha

Adicionar também a possibilidade de usar um PIN rápido após o primeiro login.

O site deve ser privado.

Não criar visão pública de jogadores nesta primeira versão.

==================================================

6. DASHBOARD PRINCIPAL

==================================================

Ao entrar, mostrar:

Título:

OPERAÇÃO BERÇO VAZIO

Subtítulo:

PAINEL DO MESTRE

Informações principais:

• sessão atual;

• dia atual;

• horário atual dentro do RPG;

• local atual do grupo;

• cena atual;

• caminho escolhido;

• pistas encontradas;

• pistas disponíveis;

• eventos futuros agendados;

• nível de atenção atraída;

• última ação registrada.

Adicionar botões grandes:

“CONTINUAR SESSÃO”

“INICIAR NOVA SESSÃO”

“ABRIR DIAGRAMA”

“ABRIR TIMELINE”

“LOCAIS E SALAS”

“PISTAS”

“PERSONAGENS”

“CONSEQUÊNCIAS”

“RESUMO DA SESSÃO”

“EDITAR CAMPANHA”

Adicionar salvamento automático.

Mostrar no topo:

DIA 1 ou DIA 2

Horário atual

Local atual

Cena atual

Status de salvamento

==================================================

7. MODO SESSÃO AO VIVO

==================================================

Essa será a tela mais importante do site.

Criar uma interface com três colunas.

COLUNA ESQUERDA — CAMINHO PERCORRIDO

Mostrar o histórico da sessão:

• chegada ao campus;

• rota escolhida;

• locais visitados;

• decisões tomadas;

• testes realizados;

• pistas encontradas;

• consequências ativadas.

Cada item deve possuir horário e ícone.

Exemplo:

08:05 — Grupo chegou à Universidade Valença

08:20 — Escolheram explorar o campus

08:35 — Visitaram o refeitório

08:40 — Encontraram “Água com Gosto Metálico”

09:10 — Foram para o auditório

Permitir clicar em qualquer item para ver detalhes.

COLUNA CENTRAL — CENA ATUAL

Mostrar:

• nome da cena;

• local;

• horário;

• descrição para o mestre;

• descrição sugerida para narrar aos jogadores;

• acontecimentos obrigatórios;

• ações possíveis;

• testes possíveis;

• pistas disponíveis;

• riscos;

• segredos do mestre;

• consequências possíveis.

A descrição para os jogadores deve estar separada dos segredos do mestre.

Adicionar botão de copiar na descrição narrativa.

COLUNA DIREITA — CONTROLE RÁPIDO

Botões:

“PISTA ENCONTRADA”

“PISTA PERDIDA”

“TESTE: SUCESSO”

“TESTE: FALHA”

“GRUPO FOI PARA OUTRO LOCAL”

“AVANÇAR HORÁRIO”

“ATIVAR EVENTO”

“ADICIONAR NOTA”

“DESFAZER ÚLTIMA AÇÃO”

Mostrar também:

• próximas escolhas;

• consequências pendentes;

• pistas obrigatórias ainda não entregues;

• botão de contingência.

==================================================

8. FUNCIONAMENTO DAS ESCOLHAS

==================================================

Sempre que existir uma decisão, mostrar botões grandes com as opções.

Exemplo:

O QUE ELES FAZEM PRIMEIRO?

[ EXPLORAR O CAMPUS ]

[ IR AO AUDITÓRIO ]

[ CONVERSAR COM PESSOAS ]

[ TENTAR ACESSAR ÁREAS RESTRITAS ]

Quando o mestre clicar em uma opção:

• registrar a escolha;

• destacar a rota escolhida;

• mostrar a próxima cena;

• mostrar os locais acessíveis naquela rota;

• mostrar as pistas que podem ser descobertas;

• mostrar possíveis ações;

• mostrar consequências;

• manter as outras rotas disponíveis, caso o grupo mude de ideia.

Não bloquear permanentemente uma rota sem confirmação do mestre.

Antes de fechar uma rota, perguntar:

“Deseja marcar esta rota como ignorada?”

Opções:

• manter disponível;

• marcar como ignorada;

• tornar indisponível;

• agendar para depois.

==================================================

9. SISTEMA DE LOCAIS E SALAS

==================================================

Criar uma página chamada:

“LOCAIS E SALAS”

Não criar mapa geográfico nesta primeira versão.

Usar cards e uma lista organizada por setor.

Cada local deve mostrar:

• nome;

• descrição;

• disponibilidade;

• dia em que pode ser acessado;

• horário recomendado;

• pré-requisitos;

• pessoas presentes;

• ações possíveis;

• pistas;

• testes;

• perigos;

• consequências;

• locais conectados.

Quando o mestre clicar em uma sala, abrir uma tela detalhada com o título:

“NESTA SALA ELES PODEM ENCONTRAR”

Abaixo, mostrar as pistas pelo nome, uma por uma.

Cada pista precisa ser clicável.

Estados da sala:

• não visitada;

• disponível;

• sendo investigada;

• investigada parcialmente;

• investigada completamente;

• bloqueada;

• isolada;

• inacessível;

• pode ser revisitada.

==================================================

10. LOCAIS INICIAIS DA CAMPANHA

==================================================

Cadastrar inicialmente os seguintes locais:

--------------------------------------------------

PÁTIO PRINCIPAL

--------------------------------------------------

Descrição:

Área movimentada e comum da universidade. É o primeiro contato com a rotina do campus.

Ações possíveis:

• observar estudantes;

• conversar;

• procurar sinalizações;

• verificar movimentação;

• seguir funcionários;

• observar entradas e saídas.

Nesta área eles podem encontrar:

PISTA: “Preparação do Evento no Auditório”

Descrição visível:

Funcionários e estudantes carregam equipamentos e materiais em direção ao auditório.

Significado para o mestre:

Direciona o grupo naturalmente para o evento obrigatório.

PISTA: “Funcionário Evitando Perguntas”

Descrição visível:

Um funcionário interrompe a conversa quando perguntam sobre setores antigos.

Significado para o mestre:

Mostra que existem assuntos desconfortáveis dentro da universidade.

PISTA: “Sinalização Incompleta”

Descrição visível:

Algumas placas possuem espaços, marcas ou organização estranha.

Significado para o mestre:

Introduz a possibilidade de que setores tenham sido removidos da sinalização atual.

Contingência:

Caso os jogadores ignorem tudo, alguém comenta sobre o evento do auditório.

--------------------------------------------------

CORREDORES PRINCIPAIS

--------------------------------------------------

Ações possíveis:

• observar portas;

• fotografar placas;

• ouvir conversas;

• procurar corredores vazios;

• comparar sinalizações.

Nesta área eles podem encontrar:

PISTA: “Corredor Pouco Utilizado”

Descrição visível:

Mesmo durante o horário movimentado, um corredor permanece quase vazio.

PISTA: “Placa Antiga”

Descrição visível:

Uma placa antiga parece ter sido parcialmente removida ou coberta.

PISTA: “Aviso de Manutenção sem Setor”

Descrição visível:

Um aviso de manutenção não informa claramente qual setor será afetado.

Consequência futura:

Facilita reconhecer referências a áreas ocultas durante o Dia 2.

--------------------------------------------------

REFEITÓRIO E BEBEDOUROS

--------------------------------------------------

Ações possíveis:

• comer;

• conversar;

• observar funcionários;

• examinar bebedouros;

• perguntar sobre manutenção.

Nesta sala eles podem encontrar:

PISTA: “Água com Gosto Metálico”

Descrição visível:

A água apresenta um gosto semelhante a ferro ou metal.

Significado para o mestre:

É apenas uma estranheza inicial. Não confirma o paranormal.

PISTA: “Manutenção Recente”

Descrição visível:

Um aviso informa que o sistema hidráulico passou por manutenção.

Contingência:

Se ninguém beber ou investigar, um estudante comenta sobre o gosto estranho.

--------------------------------------------------

AUDITÓRIO — ÁREA PRINCIPAL

--------------------------------------------------

Descrição:

Local do evento obrigatório e do acidente do refletor.

Antes do acidente, eles podem encontrar:

PISTA: “Preparação Técnica”

Descrição:

Refletores, caixas de som e equipamentos estão sendo ajustados.

PISTA: “Porta Técnica Entreaberta”

Descrição:

Uma porta que leva à área superior não está totalmente fechada.

PISTA: “Cabo Fora de Posição”

Descrição:

Um dos cabos parece diferente dos demais.

PISTA: “Movimentação na Passarela”

Descrição:

É possível ouvir passos ou perceber uma sombra no alto.

Depois do acidente, eles podem encontrar:

PISTA: “Cabo de Sustentação Cortado”

Descrição visível:

O rompimento apresenta um padrão limpo que não parece desgaste natural.

Significado para o mestre:

Confirma sabotagem.

PISTA: “Marca de Ferramenta no Suporte”

Descrição visível:

Há pequenas marcas recentes próximas ao ponto de fixação.

PISTA: “Direção da Fuga”

Descrição:

Uma porta técnica parece ter sido utilizada momentos após a queda.

PISTA: “Gravação do Acidente”

Descrição:

Fotos ou vídeos podem mostrar movimentação ao fundo.

Ações possíveis após a queda:

• socorrer vítima;

• examinar cabo;

• seguir movimento;

• observar reações;

• fotografar;

• filmar;

• conversar com testemunhas;

• proteger as provas.

--------------------------------------------------

PASSARELA TÉCNICA DO AUDITÓRIO

--------------------------------------------------

Pré-requisito:

Acesso pela porta técnica, chave, autorização ou entrada clandestina.

Nesta sala eles podem encontrar:

PISTA: “Marcas Recentes de Passagem”

Descrição:

Poeira e marcas indicam movimentação recente.

PISTA: “Ponto de Sabotagem”

Descrição:

O local oferece acesso direto ao cabo do refletor.

PISTA: “Objeto Derrubado”

Descrição:

Pequeno objeto genérico relacionado ao acesso ou manutenção.

O item deve ser editável pelo mestre.

PISTA: “Rota de Saída”

Descrição:

Um caminho leva da passarela a um corredor técnico.

Riscos:

• ser visto;

• ser interrompido;

• aumentar a vigilância;

• ter o acesso fechado depois.

--------------------------------------------------

BASTIDORES E SALA DE SOM

--------------------------------------------------

Nesta sala eles podem encontrar:

PISTA: “Horário Alterado”

Descrição:

O registro de preparação do auditório foi modificado.

PISTA: “Chave Não Devolvida”

Descrição:

Uma chave ou item técnico não foi devolvido no horário esperado.

PISTA: “Lista Incompleta da Equipe”

Descrição:

Existe uma inconsistência entre quem deveria trabalhar e quem esteve presente.

--------------------------------------------------

SALA DE SEGURANÇA E CÂMERAS

--------------------------------------------------

Disponível principalmente no Dia 2.

Formas de acesso:

• autorização;

• distração;

• credencial;

• invasão;

• ajuda de funcionário;

• entrada clandestina.

Nesta sala eles podem encontrar:

PISTA: “Trecho de Câmera Repetido”

Descrição visível:

Uma gravação repete o mesmo pequeno trecho antes do acidente.

Significado para o mestre:

Alguém manipulou ou substituiu parte da gravação.

PISTA: “Lacuna Antes da Queda”

Descrição:

A gravação perde alguns momentos importantes.

PISTA: “Sensor sem Imagem”

Descrição:

O sensor registrou presença, mas a câmera não mostra ninguém claramente.

PISTA: “Credencial Administrativa”

Descrição:

Um acesso foi realizado por uma credencial de nível administrativo.

PISTA: “Registro Alterado”

Descrição:

O nome ligado à credencial foi apagado ou substituído.

Consequências:

Se copiarem os arquivos:

ganham uma evidência concreta.

Se forem descobertos:

a vigilância aumenta e o acesso pode ser perdido.

Se não conseguirem entrar:

um segurança comenta que a câmera já apresentou problema antes.

--------------------------------------------------

BIBLIOTECA E ARQUIVOS

--------------------------------------------------

Disponível no Dia 2.

Nesta sala eles podem encontrar:

PISTA: “Registros de Desaparecimentos”

Descrição:

Documentos e notícias indicam que existem outros casos ligados à universidade.

PISTA: “Reforma de 2018”

Descrição:

Registros mostram uma reforma importante realizada no campus.

PISTA: “Anotações de Ricardo Nogueira”

Descrição:

Fragmentos de uma investigação antiga citam problemas, áreas ocultas ou padrões.

PISTA: “Setor Removido”

Descrição:

Um setor aparece em documentos antigos, mas não em materiais atuais.

PISTA: “Referência ao Bloco C”

Descrição:

O nome Bloco C aparece de forma incompleta ou indireta.

Significado para o mestre:

Essa é uma pista importante, mas não precisa ser encontrada obrigatoriamente no primeiro acesso.

Contingência:

Caso não encontrem, uma fotografia, página esquecida ou anotação secundária pode revelar a referência depois.

--------------------------------------------------

ADMINISTRAÇÃO E SECRETARIA

--------------------------------------------------

Disponível no Dia 2.

Nesta sala eles podem encontrar:

PISTA: “Laudo Produzido Rapidamente”

Descrição:

O documento oficial sobre o acidente foi concluído em tempo incomum.

PISTA: “Causa Genérica”

Descrição:

O laudo cita desgaste sem apresentar evidências detalhadas.

PISTA: “Ausência de Fotografias”

Descrição:

Não há imagens técnicas anexadas ao documento.

PISTA: “Alteração de Credencial”

Descrição:

Um registro de acesso foi modificado próximo ao horário do acidente.

PISTA: “Convocação Fora do Horário”

Descrição:

Existem reuniões ou convocações presenciais em horários incomuns.

Riscos:

• chamar atenção;

• documentos serem removidos depois;

• acesso ser limitado;

• funcionários passarem a observar o grupo.

--------------------------------------------------

CORREDOR DE MANUTENÇÃO

--------------------------------------------------

Nesta área eles podem encontrar:

PISTA: “Rota Não Pública”

Descrição:

O corredor liga áreas técnicas que não aparecem claramente na sinalização.

PISTA: “Etiqueta Antiga com a Letra C”

Descrição:

Uma identificação antiga contém a letra C ou referência incompleta.

PISTA: “Fechadura Diferente”

Descrição:

Uma porta utiliza sistema diferente do restante do campus.

PISTA: “Sinais de Uso Recente”

Descrição:

Apesar de parecer abandonado, o local ainda é utilizado.

==================================================

11. SISTEMA DE PISTAS

==================================================

Criar uma página chamada:

“QUADRO DE PISTAS”

Cada pista deve ser um cartão individual.

Campos de cada pista:

• ID;

• nome;

• categoria;

• descrição visível aos jogadores;

• significado secreto para o mestre;

• local principal;

• locais alternativos;

• dia disponível;

• horário disponível;

• pré-requisitos;

• ação necessária;

• teste sugerido;

• dificuldade;

• resultado de sucesso;

• resultado de falha;

• consequência;

• pista relacionada;

• próximo caminho desbloqueado;

• importância;

• contingência;

• status.

Status possíveis:

• escondida;

• disponível;

• encontrada;

• encontrada parcialmente;

• interpretada;

• não interpretada;

• perdida;

• destruída;

• removida;

• entregue por contingência.

Importância:

• ambiental;

• secundária;

• importante;

• obrigatória.

Pistas obrigatórias nunca podem desaparecer completamente.

Se uma pista obrigatória for perdida, o sistema deve sugerir automaticamente uma rota alternativa.

Exemplo:

PISTA OBRIGATÓRIA PERDIDA:

Cabo de Sustentação Cortado

CONTINGÊNCIAS SUGERIDAS:

• técnico comenta sobre o corte;

• fotografia mostra o rompimento;

• laudo contraditório chama atenção;

• testemunha viu alguém na passarela.

Adicionar filtros:

• por local;

• por dia;

• por status;

• por importância;

• por rota;

• por personagem;

• por pista relacionada.

==================================================

12. SISTEMA DE TESTES

==================================================

Ao clicar em uma ação que pode exigir teste, abrir uma janela.

Mostrar:

• nome do teste;

• objetivo;

• dificuldade sugerida;

• quem pode realizar;

• vantagem ou desvantagem;

• pistas que ajudam;

• resultado em caso de sucesso;

• resultado em caso de falha;

• consequência da falha;

• falha segura.

Botões:

“SUCESSO”

“SUCESSO PARCIAL”

“FALHA”

“FALHA CRÍTICA”

“RESOLVER SEM TESTE”

Depois de selecionar o resultado, atualizar automaticamente a cena.

Exemplo:

Teste:

Examinar o cabo do refletor.

Sucesso:

Encontram “Cabo de Sustentação Cortado”.

Sucesso parcial:

Percebem que o rompimento é estranho, mas não conseguem provar o uso de ferramenta.

Falha:

A área é isolada antes da análise.

Falha segura:

Um técnico comenta mais tarde que o rompimento não parece natural.

==================================================

13. SISTEMA DE CONSEQUÊNCIAS

==================================================

Criar uma página chamada:

“CONSEQUÊNCIAS”

Tipos:

• imediata;

• atrasada;

• condicional;

• permanente;

• reversível;

• institucional;

• social;

• investigativa.

Cada consequência deve possuir:

• causa;

• momento de ativação;

• condição;

• efeito;

• duração;

• pessoas afetadas;

• locais afetados;

• pistas afetadas;

• opção de cancelar;

• opção de adiar;

• opção de editar.

Exemplos:

CONSEQUÊNCIA:

Vigilância aumentada.

Causa:

Jogadores foram vistos entrando em área restrita.

Efeito:

Segurança passa a observar o grupo.

Ativação:

Próxima cena em área administrativa.

CONSEQUÊNCIA:

Auditório completamente isolado.

Causa:

Passagem de tempo após o acidente.

Ativação:

20:00 do Dia 1.

CONSEQUÊNCIA:

Documentos removidos.

Causa:

Grupo chamou atenção ao investigar a administração.

Ativação:

Após duas horas dentro do jogo.

==================================================

14. MEDIDORES DA CAMPANHA

==================================================

Adicionar os seguintes medidores editáveis:

ATENÇÃO DA UNIVERSIDADE

Valor: 0 a 5

0 — ninguém percebeu a investigação

1 — curiosidade leve

2 — funcionários observam

3 — segurança acompanha

4 — acessos são fechados

5 — investigação abertamente comprometida

EVIDÊNCIAS CONCRETAS

Valor: 0 a 10

EXPOSIÇÃO DE PERCY

Valor: 0 a 5

Esse medidor representa somente o risco de a missão secreta de Percy ser descoberta.

Não tratar Andy como contato separado.

ACESSO A ÁREAS RESTRITAS

• nenhum;

• temporário;

• clandestino;

• autorizado;

• perdido.

ESTADO DA VÍTIMA DO REFLETOR

• ilesa;

• ferida;

• gravemente ferida;

• estabilizada.

NÍVEL DE CONHECIMENTO SOBRE O BLOCO C

0 — nenhuma referência

1 — boato

2 — nome encontrado

3 — possível localização

4 — acesso conhecido

5 — entrada confirmada

Esses valores devem mudar automaticamente conforme as escolhas, mas o mestre pode editar manualmente.

==================================================

15. DIAGRAMA INTERATIVO

==================================================

Criar uma página usando React Flow.

O diagrama deve ser vertical, de cima para baixo.

Mostrar:

• início da campanha;

• escolhas;

• salas;

• testes;

• pistas;

• consequências;

• convergências;

• eventos obrigatórios.

Cada rota deve possuir sua própria cor.

Ao clicar em um nó:

• abrir seus detalhes;

• mostrar descrição;

• mostrar pistas;

• mostrar ações;

• permitir marcar como caminho escolhido;

• permitir marcar como ignorado;

• avançar para o próximo nó.

Nós já percorridos devem ficar destacados.

Nós não acessados devem ficar opacos.

Nós disponíveis devem pulsar discretamente.

Nós obrigatórios devem ter borda vermelha.

Nós de segredo do mestre devem ter cadeado.

Mostrar no topo:

“VOCÊ ESTÁ AQUI”

E destacar o nó atual.

Adicionar um botão:

“RETORNAR À ÚLTIMA DECISÃO”

Adicionar minimapa e zoom.

==================================================

16. TIMELINE DOS EVENTOS FIXOS

==================================================

Criar uma página separada chamada:

“TIMELINE OBRIGATÓRIA”

Essa página não representa escolhas.

Ela mostra acontecimentos fixos que ocorrem conforme o horário avança.

Adicionar relógio interno do RPG.

Botões:

+5 minutos

+15 minutos

+30 minutos

+1 hora

Escolher horário manualmente

Quando o horário alcançar um evento obrigatório, mostrar alerta:

“UM EVENTO OBRIGATÓRIO ESTÁ PRONTO PARA ACONTECER”

O mestre pode:

• ativar agora;

• adiar;

• ignorar;

• editar.

Eventos iniciais:

DIA 1

08:00 — Início da rotina universitária

09:00 às 11:30 — Exploração inicial

10:30 — Pequenas estranhezas podem aparecer

13:00 — Preparação do auditório

14:00 às 15:00 — Janela de observação técnica

15:20 — Início do evento

15:35 — Oscilação das luzes

15:37 — Acidente obrigatório do refletor

15:38 às 16:15 — Reação imediata

16:20 — Área começa a ser isolada

17:00 — Explicação de falha técnica começa a circular

18:30 às 21:30 — Investigação pós-acidente

20:00 — Acesso ao auditório fica mais difícil

21:30 — Encerramento narrativo do Dia 1

DIA 2

03:33 — Falha específica de rede e sistema

08:00 — Universidade retoma a rotina

08:30 — Auditório permanece controlado

09:00 — Versão oficial ganha força

09:30 às 12:00 — Primeira janela de investigação

10:30 — Inconsistências podem ser percebidas

13:00 às 17:00 — Investigação principal

14:30 — Registros antigos podem emergir

15:30 — Sensação de encobrimento cresce

16:30 — Acessos podem ser reforçados

18:00 às 20:30 — Comparação das pistas

20:45 — Formação da primeira teoria forte

21:15 — Encerramento do Dia 2

==================================================

17. CONTEÚDO RAMIFICADO DO DIA 1

==================================================

Primeira escolha:

“O que os personagens fazem primeiro?”

ROTA 1 — EXPLORAR O CAMPUS

Mostrar locais disponíveis:

• pátio;

• corredores;

• refeitório;

• bebedouros.

Mostrar ações:

• observar;

• conversar;

• fotografar;

• seguir funcionário;

• verificar placas;

• investigar estranhezas.

Se investigarem:

podem encontrar pistas ambientais.

Se ignorarem:

chegam ao auditório sem suspeita forte.

Contingência:

funcionário comenta sobre manutenção em áreas que ninguém usa.

ROTA 2 — IR AO AUDITÓRIO CEDO

Mostrar:

• área principal;

• porta técnica;

• estrutura;

• passarela.

Se examinarem:

podem registrar a estrutura antes da queda.

Se forem interrompidos:

confirmam que o acesso é restrito.

Contingência:

depois do acidente, lembram que a porta estava aberta.

ROTA 3 — CONVERSAR COM PESSOAS

Escolha secundária:

“Perguntas diretas ou discretas?”

Discretas:

mais informações, menos atenção.

Diretas:

menos informação, mais desconfiança institucional.

ROTA 4 — TENTAR ÁREAS RESTRITAS

Escolha secundária:

“Agem discretamente?”

Se sim:

chance de encontrar acesso, etiqueta ou sinais de uso.

Se não:

são vistos e a atenção da universidade aumenta.

PONTO DE CONVERGÊNCIA:

Todos chegam ou são atraídos ao evento no auditório.

EVENTO OBRIGATÓRIO:

Acidente do refletor.

Nova escolha:

“Como reagem?”

Opções:

• socorrer vítima;

• examinar cabo;

• seguir movimento suspeito;

• observar reações;

• fotografar ou filmar.

Permitir que vários personagens realizem ações diferentes ao mesmo tempo.

Não limitar o grupo a uma única reação.

==================================================

18. CONTEÚDO RAMIFICADO DO DIA 2

==================================================

Evento inicial:

A universidade apresenta a versão de falha técnica.

Escolha:

“Qual linha de investigação eles seguem?”

ROTA 1 — VERSÃO OFICIAL

Locais:

• administração;

• secretaria;

• testemunhas.

Pistas:

• laudo apressado;

• causa genérica;

• ausência de imagens;

• contradições.

ROTA 2 — ACESSOS E ESTRUTURA

Locais:

• auditório;

• passarela;

• bastidores;

• corredor de manutenção.

Pistas:

• marcas de ferramenta;

• rota técnica;

• etiqueta antiga;

• acesso oculto;

• possível referência ao Bloco C.

ROTA 3 — DOCUMENTOS E HISTÓRICO

Locais:

• biblioteca;

• arquivo;

• computadores;

• documentos antigos.

Pistas:

• desaparecimentos;

• reforma de 2018;

• Ricardo Nogueira;

• setor removido;

• Bloco C.

ROTA 4 — INVESTIGAR PESSOAS

Ações:

• conversar;

• observar;

• comparar versões;

• pressionar;

• confrontar.

Resultados:

• testemunha;

• contradição;

• medo;

• mentira;

• encerramento da conversa;

• aumento da atenção institucional.

ROTA 5 — INVADIR OU AGIR POR IMPULSO

Ações:

• entrar em sala de segurança;

• acessar registros;

• procurar credencial;

• invadir área técnica;

• pegar documentos.

Sucesso:

pista forte rapidamente.

Falha:

acessos fechados, segurança reforçada e documentos removidos.

Contingência:

mesmo sendo impedidos, percebem qual área foi mais protegida.

==================================================

19. SISTEMA DE CONTINGÊNCIA

==================================================

Adicionar um botão fixo chamado:

“ELES IGNORARAM TUDO”

Quando clicado, abrir sugestões de falha segura.

Sugestões:

• uma testemunha procura o grupo;

• uma foto revela detalhe;

• um funcionário comenta algo;

• documento aparece em local alternativo;

• registro fica aberto em um computador;

• porta é deixada aberta;

• notícia antiga chama atenção;

• pista secundária aponta para pista principal.

O mestre escolhe qual contingência utilizar.

Registrar no histórico que a pista foi entregue por contingência.

==================================================

20. HISTÓRICO E DESFAZER

==================================================

Todas as decisões devem ficar registradas.

Permitir:

• desfazer última ação;

• voltar até uma decisão anterior;

• criar ponto de restauração;

• carregar estado salvo;

• duplicar a campanha;

• testar um caminho sem alterar o save principal.

Criar “Modo Simulação”.

No Modo Simulação, o mestre pode testar ramificações sem alterar a sessão real.

==================================================

21. NOTAS DO MESTRE

==================================================

Adicionar notas em:

• cena;

• sala;

• pista;

• personagem;

• consequência;

• evento;

• sessão.

Permitir notas rápidas com horário.

Adicionar botão:

“ANOTAÇÃO RÁPIDA”

Exemplo:

“Percy fotografou o cabo antes do isolamento.”

“Amelie desconfiou do funcionário.”

“Sofia decidiu seguir a movimentação.”

“Augusto escolheu não interferir neste momento.”

Não transformar essas frases em ações automáticas.

São apenas exemplos de registros feitos pelo mestre.

==================================================

22. RESUMO AUTOMÁTICO DA SESSÃO

==================================================

Ao encerrar o Dia 1 ou Dia 2, gerar automaticamente:

• horários;

• locais visitados;

• escolhas;

• testes;

• sucessos;

• falhas;

• pistas encontradas;

• pistas perdidas;

• provas preservadas;

• consequências ativas;

• suspeitos;

• teorias;

• rotas ignoradas;

• estado de cada medidor;

• anotações do mestre.

Permitir exportar em:

• PDF;

• texto;

• JSON;

• impressão.

Criar também uma seção:

“INFORMAÇÕES PARA PREPARAR A PRÓXIMA PARTE”

Mostrar:

• qual caminho predominou;

• quais mistérios interessaram mais aos jogadores;

• que pistas ainda precisam aparecer;

• quem chamou mais atenção;

• quais consequências devem continuar;

• qual foi a teoria final do grupo.

==================================================

23. EDITOR DA CAMPANHA

==================================================

Criar um editor interno para o mestre adicionar:

• novos dias;

• novas cenas;

• novas salas;

• novas escolhas;

• novas pistas;

• novos testes;

• novas consequências;

• novos personagens;

• novas contingências;

• novos eventos obrigatórios.

O editor deve permitir arrastar e soltar.

No diagrama, permitir criar uma conexão arrastando entre os nós.

Campos obrigatórios para uma nova cena:

• título;

• descrição do mestre;

• texto narrativo;

• dia;

• horário;

• local;

• tipo;

• pré-requisitos;

• escolhas;

• pistas;

• testes;

• consequências;

• contingência;

• próximos caminhos.

==================================================

24. MODELO DE DADOS

==================================================

Estruturar os dados aproximadamente assim:

Campaign

- id

- name

- currentDay

- currentTime

- currentSceneId

- currentLocationId

- attentionLevel

- evidenceCount

- percyExposure

- restrictedAccess

- blockCKnowledge

- victimStatus

- createdAt

- updatedAt

Player

- id

- playerName

- characterName

- status

- notes

- isPending

Scene

- id

- title

- day

- time

- locationId

- sceneType

- mandatory

- masterDescription

- narrationText

- prerequisites

- choices

- clues

- tests

- consequences

- fallbackSceneId

- nextSceneIds

- status

Choice

- id

- sceneId

- title

- description

- routeColor

- requirements

- effects

- nextSceneId

- status

Location

- id

- name

- sector

- description

- availability

- dayAvailable

- connectedLocations

- actions

- clues

- tests

- risks

- status

Clue

- id

- name

- category

- playerDescription

- masterMeaning

- mainLocationId

- alternativeLocationIds

- dayAvailable

- prerequisites

- actionRequired

- testId

- successResult

- failureResult

- consequenceIds

- relatedClueIds

- unlocks

- importance

- fallbackOptions

- status

Test

- id

- name

- description

- difficulty

- suggestedCharacters

- advantages

- disadvantages

- success

- partialSuccess

- failure

- criticalFailure

- fallback

Consequence

- id

- name

- type

- cause

- triggerTime

- conditions

- effect

- duration

- affectedLocations

- affectedClues

- affectedCharacters

- status

CampaignLog

- id

- campaignId

- day

- time

- actionType

- description

- previousState

- newState

- createdAt

==================================================

25. REGRAS FINAIS

==================================================

Não criar um site estático.

Não criar apenas um conjunto de cards sem interação.

Não criar um simples arquivo de texto dividido em páginas.

O sistema precisa funcionar como um verdadeiro painel de controle do mestre.

Todos os caminhos devem ser clicáveis.

Todas as salas devem mostrar claramente:

“NESTA SALA ELES PODEM ENCONTRAR:”

E listar as pistas disponíveis naquela sala.

Todas as pistas devem possuir sucesso, falha e contingência.

Todas as ações devem ser registradas.

A timeline obrigatória deve funcionar separadamente do diagrama de escolhas.

O mestre deve conseguir seguir a sessão sem precisar procurar informações em documentos externos.

A tela do modo sessão deve sempre responder às perguntas:

1. Onde o grupo está?

2. O que está acontecendo agora?

3. O que eles podem fazer?

4. O que podem encontrar?

5. Que teste pode ser pedido?

6. O que acontece se tiverem sucesso?

7. O que acontece se falharem?

8. O que muda depois?

9. Para onde podem ir agora?

10. Existe algum evento obrigatório próximo?

Entregar a aplicação já com todos os conteúdos dos Dias 1 e 2 cadastrados e funcionais.

Priorizar primeiro uma versão MVP completamente funcional.

Depois melhorar animações, aparência e recursos secundários.

Não entregar apenas uma explicação de como construir.

Construir o projeto completo.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://shadow-map-tracker.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c3dda0f5-55b8-4f98-b75a-c3877b5e130f).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
