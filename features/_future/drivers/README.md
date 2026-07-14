# Área do Motorista (futuro)

Cadastro de documentos (CNH com EAR, veículo), disponibilidade e histórico de
ganhos. Entra como `app/(dashboard)/motorista/`, com tabela `drivers` (1:1 com
`users`) e service próprio em `services/drivers`. Depende do módulo de
Autenticação existir primeiro.
