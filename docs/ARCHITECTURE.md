# Architecture Overview

- **Frontend**: Vanilla HTML/JS with CSS, calling REST APIs directly from the browser. 
- **Backend API**: Node.js + Express
- **Database**: MySQL 

## Key Modules
- `controllers/`: Handles business logic
- `routes/`: Maps express endpoints to controllers
- `middleware/`: Extracts and validates JSON Web Tokens
