# SKILLS SUBSYSTEM

Las Skills constituyen el mecanismo de conocimiento modular y reutilizable de Nexus AI Lab.

## Carga Bajo Demanda

Nexus no carga todas las skills en la ventana de contexto. Emplea carga bajo demanda (lazy loading), inyectando las directrices de una skill únicamente cuando la tarea lo requiere.

## Catálogo de Skills Locales

Ubicadas en `skills/`:
- `coding/SKILL.md`
- `debugging/SKILL.md`
- `testing/SKILL.md`
- `frontend/SKILL.md`
- `backend/SKILL.md`
- `database/SKILL.md`
- `linux/SKILL.md`
- `git/SKILL.md`
- `android/SKILL.md`
- `python/SKILL.md`
- `javascript/SKILL.md`
- `typescript/SKILL.md`
- `documentation/SKILL.md`
- `security/SKILL.md`
- `research/SKILL.md`
- `devops/SKILL.md`

## Integración con Skills Globales

Nexus detecta automáticamente las skills configuradas en el entorno del usuario (`~/.gemini/config/skills/`), incluyendo:
- `zeus`: Supervisor y root-cause debugger.
- `apolo`: Arquitecto y optimizador de software.
- `atenea`: Orquestación y planificación sistemática.
- `afrodita-qa`: Testing adversarial y TDD.
- `tortugas-ninjas`: Escuadrón de ingeniería multi-rol.
- `optiram`: Contención de memoria y optimización de recursos.
