# Redmine MCP Server - Implementation Overview

> **For Claude:** Use superpowers:subagent-driven-development to execute phases with parallel subagents.

## Phase Summary

| Phase | Tasks | Parallel? | Beschreibung |
|-------|-------|-----------|--------------|
| 1 | 1 | Nein | Types erweitern |
| 2 | 1 | Nein | Client erweitern |
| 3 | 3 | **Ja** | Infrastructure (Registry, CLI, Server) |
| 4 | 7 | **Ja** | Tool-Gruppen (core, metadata, wiki, files, relations, search, account) |
| 5 | 1 | Nein | Cleanup & README |

**Gesamt: 13 Tasks, 43 neue Tools**

---

## Execution Flow

```
Phase 1 (sequential)
    │
    ▼
Phase 2 (sequential)
    │
    ▼
Phase 3 (3 parallel tasks)
    ├── Task 3.1: Tool-Registry
    ├── Task 3.2: CLI-Parameter
    └── Task 3.3: Server anpassen
    │
    ▼ (wait for all, then code review + commit)
    │
Phase 4 (7 parallel tasks)
    ├── Task 4.1: core.ts
    ├── Task 4.2: metadata.ts
    ├── Task 4.3: wiki.ts
    ├── Task 4.4: files.ts
    ├── Task 4.5: relations.ts
    ├── Task 4.6: search.ts
    └── Task 4.7: account.ts
    │
    ▼ (wait for all, then code review + commit)
    │
Phase 5 (sequential)
    │
    ▼
Done!
```

---

## Phase Plans

- [Phase 1: Foundation (Types)](./phase-1-foundation.md)
- [Phase 2: Client](./phase-2-client.md)
- [Phase 3: Infrastructure](./phase-3-infrastructure.md)
- [Phase 4: Tool-Gruppen](./phase-4-tool-groups.md)
- [Phase 5: Cleanup](./phase-5-cleanup.md)

---

## Workflow pro Phase

### Für sequentielle Phasen (1, 2, 5):

1. Task ausführen
2. Code Review mit `superpowers:requesting-code-review`
3. Bei Erfolg: Commit

### Für parallele Phasen (3, 4):

1. Starte alle Tasks parallel mit `superpowers:dispatching-parallel-agents`
2. Warte auf Abschluss aller Tasks
3. Code Review aller Änderungen
4. Bei Erfolg: Ein Commit pro Phase

---

## Commit Messages

- Phase 1: `feat: extend TypeScript types for all Redmine API resources`
- Phase 2: `feat: extend RedmineClient with all API methods`
- Phase 3: `feat: add tool registry and CLI parameter support`
- Phase 4: `feat: implement all tool groups (43 tools)`
- Phase 5: `chore: cleanup old files and update documentation`

---

## Verification Checklist

Nach jeder Phase prüfen:

- [ ] `npm run build` erfolgreich
- [ ] Keine TypeScript-Fehler
- [ ] Code Review bestanden
- [ ] Commit erstellt

Am Ende:

- [ ] `node dist/index.js --help` zeigt alle Gruppen
- [ ] `--tools=core` lädt nur Core-Tools
- [ ] `--exclude=wiki` schließt Wiki aus
- [ ] Alle 43 Tools verfügbar bei Standard-Start
