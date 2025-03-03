# Diagramas de Fluxo

Esta pasta contém diagramas que explicam os fluxos de processamento de documentos fiscais eletrônicos no sistema NFe Fácil.

## Diagrama de Fluxo da NFSe

O arquivo `nfse-flow-diagram.png` deve ser colocado nesta pasta. Este diagrama ilustra o fluxo de processamento de Notas Fiscais de Serviço Eletrônicas (NFSe), incluindo:

- Processamento síncrono de NFSe
- Processamento assíncrono por lotes
- Ciclo de vida de um lote de processamento de NFSe
- Estados e transições do processamento
- Interações com serviços externos

### Como adicionar o diagrama

1. Crie um diagrama de fluxo do processamento de NFSe usando uma ferramenta como Draw.io, Lucidchart, Mermaid ou similar
2. Exporte o diagrama como um arquivo PNG de alta resolução
3. Nomeie o arquivo como `nfse-flow-diagram.png`
4. Coloque o arquivo nesta pasta
5. O diagrama será referenciado automaticamente na documentação da API através do Swagger

### Requisitos do diagrama

O diagrama deve ser claro, conciso e incluir pelo menos:

- Os diferentes endpoints e suas conexões
- O fluxo de processamento síncrono vs. assíncrono
- Estados do lote de processamento
- Pontos de integração com sistemas externos (se aplicável)
- Legendas explicativas em português brasileiro

### Exemplo de estrutura recomendada

```
[Upload de Arquivos] → [Validação] → [Processamento] → [Extração] → [Armazenamento]
    ↑                                      ↓
[Criação de Lote] → [Adição de Arquivos] → [Processamento Assíncrono] → [Notificação]
                            ↑
                    [Consulta de Lote]     [Cancelamento]
```

Este exemplo é simplificado. O diagrama real deve ser mais detalhado e específico ao fluxo real de processamento implementado na API. 