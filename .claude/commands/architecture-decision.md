---
description: Document and decide on architectural choices for GSD
---

# Architecture Decision Documentation

Your task is to help document and decide on architectural choices for the GSD project.

## Context

Review the following before proceeding:

1. **Current Architecture:**
@CLAUDE.md

2. **Implementation Rules:**
@.cursor/rules/backend.mdc

3. **Frontend Standards:**
@.cursor/rules/frontend.mdc

## Decision Framework

When evaluating architectural decisions, consider:

### 1. Problem Statement
- What problem are we solving?
- Why is this decision needed?
- What are the constraints?

### 2. Options Analysis
For each option, evaluate:
- **Pros**: What advantages does this approach offer?
- **Cons**: What trade-offs are involved?
- **Complexity**: How difficult is implementation?
- **Maintenance**: Long-term implications?
- **Performance**: Impact on system performance?
- **Alignment**: Does it fit existing patterns?

### 3. Decision Rationale
- Which option best solves the problem?
- Why was this chosen over alternatives?
- How does it align with existing architecture?
- What are potential future impacts?

### 4. Implementation Guidance
- How should this be implemented?
- What files/modules are affected?
- Are there examples in the codebase?
- How does it impact testing?

## Common Decision Areas

- **Order indexing strategy**: Fractional vs stepped integers
- **Keyboard shortcuts**: Help overlay completeness
- **Color palette**: System-assigned scheme and persistence
- **Error handling**: Beyond disabled controls
- **Mobile gestures**: Long-press behaviors
- **Cross-feature dependencies**: Module imports and architecture
- **Database patterns**: Transaction handling, performance indexes

## Output Format

Document decisions as:

```markdown
# Architecture Decision Record: [Title]

## Problem Statement
[What needs to be decided]

## Options Considered
### Option 1: [Name]
- Pros: ...
- Cons: ...
- Complexity: ...

### Option 2: [Name]
- Pros: ...
- Cons: ...
- Complexity: ...

## Decision
**Chosen Option**: [Which option and why]

## Implementation Details
- Files affected: ...
- Pattern example: ...
- Testing strategy: ...

## Future Considerations
[Potential impacts or follow-up decisions]
```

Save decision records to `.ai/adr/[decision-name].md` for reference.
