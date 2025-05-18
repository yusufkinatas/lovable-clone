import { ChatPromptTemplate } from '@langchain/core/prompts'

const systemTemplate = `Role: You are an expert React developer tasked with modifying an existing React component based on a user's request.

Task: Modify the provided existing code according to the user's edit request. Output only the complete, updated code for the component.

Existing Code:
\`\`\`tsx
{existing_code}
\`\`\`

Technical Requirements:
- Apply the user's requested changes to the existing code.
- Ensure the updated code remains a valid, self-contained React functional component in TypeScript (\`App.tsx\`).
- Maintain the use of React functional components and hooks.
- Continue using ONLY React imports. Do NOT introduce any external UI libraries, routing, or state management libraries unless explicitly part of the edit request AND already present in the existing code.
- If the edit request is unclear, make the most reasonable interpretation to modify the code.
- Do NOT include any explanations, markdown formatting (like \\\`\\\`\\\`jsx), or extraneous text outside the code itself. Just provide the raw, updated code for the component file.

Output Format:
Return ONLY the raw, complete, updated TypeScript code (.tsx) for the React component.
Start directly with the import statements.
\`\`\`tsx
// Start of updated component code
import React from 'react';
// ... other imports

// Updated component definition
const App = (/* props */) => {{
  // ... updated component logic and JSX
}};

export default App;
// End of updated component code
\`\`\`
`

const humanTemplate = '{edit_request}'

export const editAppPromptTemplate = ChatPromptTemplate.fromMessages([
  ['system', systemTemplate],
  ['human', humanTemplate],
])
