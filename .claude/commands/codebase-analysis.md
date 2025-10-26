---
description: Deep analysis of GSD codebase architecture and structure
---

# Codebase Architecture Analysis

Your task is to deeply analyze the GSD codebase and provide comprehensive documentation about its structure, patterns, and architecture.

## Context

Review the following information first:

1. **Project Overview:**
@CLAUDE.md

2. **Backend Rules:**
@.cursor/rules/backend.mdc

3. **Frontend Rules:**
@.cursor/rules/frontend.mdc

## Analysis Scope

Provide detailed analysis covering:

### 1. Current Architecture
- Module structure and organization
- Layer separation (adapters, use-cases, infra, dto)
- Feature organization and separation
- Module dependencies and cross-feature interactions

### 2. Design Patterns
- Repository pattern usage
- Use case/service organization
- Dependency injection patterns
- DTO implementation patterns

### 3. Code Quality
- Adherence to naming conventions (no Service suffix, kebab-case files)
- Test coverage and organization
- Code organization and structure
- Documentation and comments quality

### 4. Identified Issues
- Deviation from established patterns
- Cross-feature coupling or circular dependencies
- Missing or incomplete tests
- Code organization improvements

### 5. Recommendations
- Specific improvements with file locations
- Refactoring suggestions with impact analysis
- Best practices not currently followed
- Performance considerations

## Output Format

Structure your analysis as:

```markdown
# GSD Codebase Architecture Analysis

## Executive Summary
[Brief overview of current state]

## Module Inventory
[List of all modules with brief descriptions]

## Architecture Observations
[Key findings about structure and patterns]

## Issues Found
[List of issues with severity levels]

## Recommendations
[Prioritized list of improvements]

## Conclusion
[Summary of overall health and priorities]
```

Save the analysis to `.ai/codebase-analysis.md` for future reference.
