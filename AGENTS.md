# AGENT REGISTRY & PERFILES DE AGENTES

Nexus desacopla los perfiles de agentes abstractos de las implementaciones específicas instaladas en el sistema.

## Perfiles Abstractos Soportados

| Perfil | Rol Conceptual | Mapeo OpenCode | Mapeo Gemini |
| :--- | :--- | :--- | :--- |
| `ARCHITECT` | Diseño de sistemas y decisiones estructurales | `plan` | `self` |
| `CODER` | Implementación de funciones y lógica de software | `build` | `self` |
| `DEBUGGER` | Análisis de errores, stack traces y solución de bugs | `build` | `self` |
| `TESTER` | Creación y ejecución de suites de pruebas (TDD) | `build` | `self` |
| `REVIEWER` | Inspección de diffs y calidad de código | `general` | `self` |
| `SECURITY` | Auditoría de vulnerabilidades y hardening | `general` | `self` |
| `RESEARCHER` | Búsqueda de documentación e información | `explore` | `research` |
| `DOCUMENTATION` | Generación de manuales, READMEs y docstrings | `general` | `self` |
| `DEVOPS` | Pipelines CI/CD, scripts bash y configuración | `general` | `self` |
| `DATABASE` | Esquemas, migraciones y consultas SQL | `build` | `self` |
| `FRONTEND` | UI/UX, layouts y componentes visuales | `build` | `self` |
| `BACKEND` | APIs REST, servidores y servicios | `build` | `self` |

## Descubrimiento Dinámico

Al ejecutar `nexus agents`, Nexus consulta en tiempo real al motor activo para verificar los agentes reales disponibles sin asumir nombres predeterminados.
