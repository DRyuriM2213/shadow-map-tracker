export interface DocumentMeta {
  code?: string;
  continuityWarning?: string;
}

/**
 * Metadados dos props físicos 01–40. O aviso é PRIVADO DO MESTRE e nunca
 * reescreve o papel impresso. A chave é o filename canônico usado em sourceDocument.
 */
export const DOCUMENT_META: Record<string, DocumentMeta> = {
  "01_Relatorio_Alteracoes_Academicas.docx": { code: "UV-SEC-2026-031" },
  "02_Registro_Suspensao_Credenciais.docx": { code: "UV-TI-2026-118" },
  "03_Relatorio_Excecoes_WiFi.docx": { code: "UV-TI-2026-119" },
  "04_Chamado_TI_Sofia_Mendes.docx": { code: "UV-TI-2026-087" },
  "05_Formulario_Pendencia_Bruno_Castro.docx": { code: "UV-SEC-2025-204" },
  "06_Memorando_Atendimento_Presencial.docx": { code: "UV-DIR-2023-014" },
  "07_Livro_Ocorrencias_Secretaria.docx": { code: "UV-SEC-2026-122" },
  "08_Registro_Convocacoes_Automaticas.docx": { code: "UV-SEC-2026-123" },
  "09_Historico_Parcial_Lucas_Valente.docx": { code: "UV-SEC-2023-066" },
  "10_Boletim_Interno_18_2026.docx": { code: "UV-SEC-2026-124" },
  "11_Registro_Emprestimos_Nao_Devolvidos.docx": { code: "UV-BIB-2026-041" },
  "12_Relacao_Obras_Em_Atraso.docx": { code: "UV-BIB-2026-042" },
  "13_Ficha_Consulta_Ricardo_Nogueira.docx": { code: "UV-ARQ-2018-117" },
  "14_Agenda_Bibliotecaria_17_08_2026.docx": { code: "UV-BIB-2026-043" },
  "15_Relatorio_Reorganizacao_Arquivo.docx": { code: "UV-ARQ-2026-044" },
  "16_Ficha_Obra_Rara_Anatomia.docx": { code: "UV-BIB-CE-1912-006" },
  "17_Controle_Consolidado_Reagentes.docx": { code: "UV-LAB-2026-051" },
  "18_Solicitacao_Compra_Acido_Fluoridrico.docx": { code: "UV-COM-2026-052" },
  "19_Livro_Ocorrencias_Laboratorio.docx": { code: "UV-LAB-2026-053" },
  "20_Inventario_Fisico_Laboratorio.docx": { code: "UV-LAB-2026-054" },
  "21_Ficha_Seguranca_Quimica.docx": { code: "UV-LAB-SQ-021" },
  "22_Registro_Acessos_Noturnos_Laboratorio.docx": { code: "UV-SEG-LAB-2026-055" },
  "23_Relatorio_Ronda_Noturna.docx": { code: "UV-SEG-2026-061" },
  "24_Laudo_Falha_Camera_C17.docx": {
    code: "UV-SEG-CFTV-2025-062",
    continuityWarning: "O papel impresso analisa explicitamente um evento de 19/03/2025. Não trate este laudo automaticamente como a gravação da madrugada de 16→17/08/2026.",
  },
  "25_Solicitacao_Segunda_Via_Cracha.docx": { code: "UV-ATI-2026-063" },
  "26_Comunicado_Permanencia_Apos_22h.docx": { code: "UV-COM-2026-064" },
  "27_Ordem_Servico_Manutencao_Catracas.docx": { code: "UV-OS-2026-065" },
  "28_Comunicado_Instabilidade_WiFi.docx": { code: "UV-TI-COM-2026-066" },
  "29_Ata_Conselho_Estudantil.docx": {
    code: "UV-CE-2026-067",
    continuityWarning: "O prop impresso usa “Thaissa Santos” como presidente do Conselho. No cânone atual, Thaissa é player e Amelie é a personagem dela. Preserve o papel e trate isso como conflito privado do mestre.",
  },
  "30_Registro_Emprestimo_Chaves.docx": {
    code: "UV-CE-CHV-2026-068",
    continuityWarning: "O prop impresso contém “Alice Valença” e “Thaissa Santos”. Alice saiu do RPG e Thaissa é player. Não transforme esses nomes em NPCs atuais nem reescreva o papel silenciosamente.",
  },
  "31_Lista_Voluntarios_Mostra.docx": {
    code: "UV-EXT-2026-069",
    continuityWarning: "O prop impresso usa “Thaissa Santos” como responsável por voluntários. Isso é um conflito de continuidade com Thaissa/Amelie; preserve o documento físico.",
  },
  "32_Relatorio_Manifestacoes_Estudantis.docx": {
    code: "UV-CE-2026-070",
    continuityWarning: "O prop impresso atribui a elaboração a “Thaissa Santos”. Isso não deve transformar a player Thaissa em NPC nem substituir Amelie.",
  },
  "33_Programacao_Oficial_Auditorio.docx": {
    code: "UV-EXT-AUD-2026-071",
    continuityWarning: "A programação impressa de 17/08 registra aula inaugural às 09h e ensaio técnico às 14h; ela não coincide integralmente com a timeline de cena atual. Use o papel como prop e decida a conciliação em mesa sem alterá-lo.",
  },
  "34_Relatorio_Manutencao_Auditorio.docx": {
    code: "UV-INF-AUD-2026-072",
    continuityWarning: "O prop é de 17/08/2026 e registra abertura do relatório às 10h42, enquanto a timeline do site posiciona o acidente mais tarde. Não use o horário do relatório como prova cronológica até o mestre resolver o conflito.",
  },
  "35_Credenciamento_Palestra_Seguranca_Digital.docx": {
    code: "UV-EXT-2026-073",
    continuityWarning: "A lista impressa inclui “Thaissa Santos”. No cânone atual Thaissa é player/Amelie; não crie uma NPC homônima automaticamente.",
  },
  "36_Cardapio_Semanal_Refeitorio.docx": { code: "UV-SAN-2026-074" },
  "37_Comunicado_Sanitizacao_Vestiarios.docx": { code: "UV-SGM-2026-075" },
  "38_Programa_Monitoria_Apoio_Academico.docx": { code: "UV-PRA-2026-076" },
  "39_Quadro_Horarios_Docentes.docx": { code: "UV-SEC-HOR-2026-077" },
  "40_Inventario_Achados_Perdidos.docx": {
    code: "UV-SEG-AP-2026-078",
    continuityWarning: "O prop registra o celular de Sofia Mendes como retirado por “Alice Valença”. Alice saiu do RPG. Preserve a linha impressa, mas não trate Alice como NPC/personagem atual.",
  },
};
