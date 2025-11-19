You are an experienced software architect whose task is to create a detailed implementation plan for a feature. Your plan will guide the development team in effectively and correctly implementing this endpoint.

Before we begin, review the following information:

1. Specification:
   <prd>
   </prd>

2. Tech stack:
   <tech_stack>
   {{tech-stack}}
   </tech_stack>

3. Implementation rules:
   <implementation_rules>
   @.cursor/rules/backend.mdc
   </implementation_rules>

Your task is to create a comprehensive implementation plan for the feature. Before delivering the final plan, use <analysis> tags to analyze the information and outline your approach. In this analysis, ensure that:

1. Summarize key points of the API specification if it's relevant. Not all features are API-based.
2. List required and optional parameters.
3. List necessary DTO types and Models.
4. Consider how to extract logic to a service/use-case/repository/adapter (existing or new, if it doesn't exist).
5. Plan input validation , database resources, and implementation rules, if relevant.
6. Determine how to log errors in the error table (if applicable).
7. Identify potential security threats based on the API specification and tech stack.
8. Outline potential error scenarios and corresponding status codes.

After conducting the analysis, create a detailed implementation plan in markdown format. The plan should contain the following sections:

1. Feature Overview
2. Input Details
3. Output Details
4. Data Flow
5. Security Considerations
6. Error Handling
7. Performance
8. Implementation Steps

Throughout the plan, ensure that you:

- Use correct API status codes:
  - 200 for successful read
  - 201 for successful creation
  - 400 for invalid input
  - 401 for unauthorized access
  - 404 for not found resources
  - 500 for server-side errors
- Adapt to the provided tech stack
- Follow the provided implementation rules

The final output should be a well-organized implementation plan in markdown format. Here's an example of what the output should look like:

``markdown

# API Endpoint Implementation Plan: [Endpoint Name]

## 1. Endpoint Overview

[Brief description of endpoint purpose and functionality]

## 2. Inputs

- Parameters:
  - Required: [List of required parameters]
  - Optional: [List of optional parameters]
- Request Body: [Request body structure, if applicable]

## 3. Used Types

[DTOs and Models necessary for implementation]

## 3. Outputs

[Expected response structure and status codes]

## 4. Data Flow

[Description of data flow, including interactions with external services or databases]

## 5. Security Considerations

[Authentication, authorization, and data validation details]

## 6. Error Handling

[List of potential errors and how to handle them]

## 7. Performance Considerations

[Potential bottlenecks and optimization strategies]

## 8. Implementation Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]
   ...

```

The final output should consist solely of the implementation plan in markdown format and should not duplicate or repeat any work done in the analysis section.

Remember to save your implementation plan as .ai/{{feature}}-implementation-plan.md. Ensure the plan is detailed, clear, and provides comprehensive guidance for the development team.
```
