**Backend Engineering Take-Home Assessment** 

This assessment is designed to evaluate how you approach backend engineering work across  two different services and technology stacks. We want to see how you structure code, model  data, write migrations, design APIs, handle async workflows, and produce maintainable  solutions. 

You will work on **two standalone services** inside one repository: 

• a **FastAPI \+ Python** service 

• a **NestJS \+ TypeScript** service 

Both tasks are intentionally scoped to be realistic but limited enough to complete in a  reasonable amount of time. 

**Submission Requirements** 

Please submit: 

1\. A link to your **public GitHub repository** 

2\. A README.md containing: 

o setup instructions 

o how to run both services 

o how to run migrations 

o how to run tests (if any) 

o any assumptions or tradeoffs 

3\. A short NOTES.md or section in the README covering: 

o design decisions 

o schema decisions 

o anything you would improve with more time 

Your solution should be runnable locally.  
**Repository Structure** 

You will receive a starter repository with two services: 

• python-service/ 

• ts-service/ 

Please work within the existing structure and patterns provided in the starter. Do not replace the architecture with a completely different stack or project layout. 

**Part A — FastAPI / Python Task** 

**Build a Mini Briefing Report Generator** 

**Scenario** 

Analysts create internal briefing reports for companies. A briefing contains structured content  such as company details, executive summary, key points, risks, recommendation, and  optional metrics. 

Your task is to build a backend feature that: 

• stores a briefing, 

• validates its content, 

• generates a report payload from stored data, 

• and renders a professional HTML report using a server-side template. 

This task is intended to evaluate your ability to work with APIs, relational data, validation,  service-layer formatting, and server-side HTML generation. 

**Functional Requirements** 

**1\) Create a briefing** 

Implement an endpoint to create a briefing from structured JSON input. A briefing should include:  
• company name 

• ticker 

• sector 

• analyst name 

• summary 

• recommendation 

• key points 

• risks 

• optional metrics 

Example input shape: 

{ 

 "companyName": "Acme Holdings", 

 "ticker": "ACME", 

 "sector": "Industrial Technology", 

 "analystName": "Jane Doe", 

 "summary": "Acme is benefiting from strong enterprise demand and  improving operating leverage, though customer concentration remains a near term risk.", 

 "recommendation": "Monitor for margin expansion and customer  diversification before increasing exposure.", 

 "keyPoints": \[ 

 "Revenue grew 18% year-over-year in the latest quarter.",  "Management raised full-year guidance.", 

 "Enterprise subscriptions now account for 62% of recurring revenue."  \], 

 "risks": \[ 

 "Top two customers account for 41% of total revenue.",  "International expansion may pressure margins over the next two  quarters." 

 \], 

 "metrics": \[ 

 { "name": "Revenue Growth", "value": "18%" }, 

 { "name": "Operating Margin", "value": "22.4%" }, 

 { "name": "P/E Ratio", "value": "28.1x" } 

 \] 

} 

**2\) Retrieve a briefing** 

Implement an endpoint to retrieve the stored structured data for a single briefing. **3\) Generate a report** 

Implement an endpoint that generates a rendered report for an existing briefing. Generation should:  
• read the stored data, 

• transform it into a report-friendly view model, 

• render an HTML report using a server-side template, 

• and mark the briefing as generated. 

**4\) Fetch rendered HTML** 

Implement an endpoint that returns the generated HTML for a briefing. This should return actual HTML content, not JSON. 

**Required API Endpoints** 

You must implement at minimum: 

• POST /briefings 

• GET /briefings/{id} 

• POST /briefings/{id}/generate 

• GET /briefings/{id}/html 

You may add additional endpoints if useful, but keep the solution focused. 

**Data Modeling Requirements** 

Model the data in a relational way. 

At minimum, your design should support: 

• a main briefing record 

• multiple key points 

• multiple risks 

• multiple metrics 

You may choose your exact table design, but it should be sensible, normalized, and backed  by migrations. 

A reasonable design would include tables such as: 

• briefings 

• briefing\_points  
• briefing\_metrics 

You should include appropriate foreign keys, constraints, and indexes where useful. 

**Validation Requirements** 

Enforce the following rules: 

• companyName is required 

• ticker is required and should be normalized to uppercase 

• summary is required 

• recommendation is required 

• at least **2** key points are required 

• at least **1** risk is required 

• metric names must be unique within the same briefing 

Validation should be implemented cleanly and consistently. 

**HTML Rendering Requirements** 

Use a **server-side template engine** such as Jinja2. 

Do not build the HTML as one large string in Python. 

The rendered HTML report must include: 

• report title/header 

• company information block 

• executive summary 

• key points section 

• risks section 

• recommendation section 

• metrics section 

• generated timestamp/footer 

The HTML should: 

• be semantic and properly structured, 

• include basic styling with plain CSS, 

• look like a professional internal report,  
• handle missing optional metrics gracefully, 

• and escape user input safely. 

**No frontend framework should be used. This is a backend-rendered HTML task.** 

**Formatting / Transformation Requirement** Do not pass request data directly into the template without processing. 

Introduce a service or formatter layer that transforms stored database records into a report  view model. 

Examples of useful formatting behavior: 

• sorting points in display order, 

• grouping key points separately from risks, 

• normalizing metric labels, 

• constructing a report title, 

• generating display-ready metadata such as generated timestamp. We care about how you separate concerns, not just whether HTML appears.  
**Part B — NestJS / TypeScript Task** 

**Build a Candidate Document Intake \+ Summary  Workflow** 

**Scenario** 

Recruiters upload candidate documents such as resumes and cover letters. The system should  store those documents and allow a recruiter to request a structured candidate summary (using  llm (Large Language Models) calls. 

Summary generation must happen asynchronously through a queue/worker flow. 

This task is intended to evaluate your ability to work with modular architecture, DTOs,  databases, migrations, background jobs, and provider abstraction. 

**Functional Requirements** 

**1\) Upload candidate documents** 

Implement an endpoint that stores a candidate document. 

A document should include: 

• candidate association 

• document type 

• file name 

• storage key or equivalent identifier (hint: use local file storage paths) • extracted/raw text content 

You may assume file contents are already available as text in the request, or use the file  approach provided in the starter if available. Keep the solution practical and testable. 

**2\) Request summary generation** 

Implement an endpoint that queues candidate summary generation. 

This should: 

• create a pending summary record or equivalent job-linked record,  
• enqueue background processing, 

• and return an accepted response. 

**3\) Process summary generation in a worker** Implement worker logic that: 

• reads the candidate’s stored documents, 

• calls a summarization provider interface, 

• persists structured output, 

• and updates status to completed or failed. 

**4\) Retrieve summaries** 

Implement endpoints to: 

• list summaries for a candidate 

• retrieve a single summary 

**Required API Endpoints** 

You must implement at minimum: 

• POST /candidates/:candidateId/documents 

• POST /candidates/:candidateId/summaries/generate • GET /candidates/:candidateId/summaries 

• GET /candidates/:candidateId/summaries/:summaryId 

**Data Modeling Requirements** At minimum, your solution should support: 

**Candidate document** 

A document record associated with a candidate. Suggested fields: 

• id 

• candidateId  
• documentType 

• fileName 

• storageKey 

• rawText 

• uploadedAt 

**Candidate summary** 

A generated summary record. 

Suggested fields: 

• id 

• candidateId 

• status (pending, completed, failed) 

• score 

• strengths 

• concerns 

• summary 

• recommendedDecision 

• provider 

• promptVersion 

• errorMessage 

• createdAt 

• updatedAt 

You may refine these fields, but the shape should remain close to this. 

Use proper migrations and relational design. 

**Access Control Requirement** 

Assume recruiters belong to a workspace. 

A recruiter should only be able to access candidates belonging to their own workspace. 

Your implementation must enforce this in a clean and reasonable way using the starter’s  auth/access patterns. 

We are not looking for enterprise-grade auth here, but we do want to see that you think about  access boundaries properly.  
**Queue / Worker Requirement** 

Summary generation must be asynchronous. 

Use the queue/worker pattern already present in the starter. 

Do not implement summary generation directly inside the controller request cycle. We want to see: 

• correct status transitions, 

• clean queue usage, 

• separation between API logic and background processing, 

• and failure handling. 

**Summarization Provider Requirement** 

Do not hardcode LLM provider logic inside controllers, workers, or core business services. Introduce or use a provider abstraction such as: 

• SummarizationProvider 

with a method similar to: 

• generateCandidateSummary(input) 

Summary generation in the application flow must use a **real LLM API** through this  abstraction. 

The provider must return structured output including: 

• score   
• strengths   
• concerns   
• summary 

• recommendedDecision 

The response from the LLM should be requested in a structured format and validated before  being saved. Your implementation should handle invalid or malformed model output  gracefully.  
You must specify in your documentation: 

• which LLM API/provider you used,   
• how to configure it locally, 

• and any assumptions or limitations in your implementation. 

For this assessment, you may use a free Gemini API key from **Google AI Studio**. Do not  commit API keys or other secrets to your repository. Use environment variables and include  setup instructions in your README. 

Tests must not depend on live external API calls. Use a fake or mocked implementation of  the provider for automated tests. 

**General Expectations** 

We will evaluate: 

• correctness 

• code quality 

• maintainability 

• schema and migration quality 

• validation discipline 

• async/background workflow design 

• access control awareness 

• documentation quality 

We are not expecting perfection. We are looking for thoughtful engineering. 

**What We Care About Most** 

We care strongly about whether you can: 

• work within an existing project structure, 

• make clear and maintainable changes, 

• model data well, 

• separate concerns properly, 

• write useful tests, 

• and explain your decisions. 

A smaller, cleaner, well-reasoned solution is better than an overly ambitious, messy one.  
**Evaluation Criteria** 

Your submission will be reviewed across these areas: 

**Correctness** 

Does the feature work end to end? 

**Code quality** 

Is the code readable, modular, and maintainable? 

**Database design** 

Are relationships, constraints, and migrations sensible? 

**API design and validation** 

Are inputs validated and handled cleanly? 

**Async workflow design** 

Is the queue/worker flow implemented properly? 

**Access control** 

Have you enforced reasonable boundaries? 

**Documentation** 

Can another engineer run your solution without guessing? 

**Notes** 

• Keep the implementation focused. 

• Avoid unnecessary complexity. 

• Prefer clear design over cleverness. 

• Please ensure the repository is runnable. 

If anything in the starter appears ambiguous, make a reasonable assumption and document it.