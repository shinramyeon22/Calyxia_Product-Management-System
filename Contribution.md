## Prerequisites
 
Before setting up the project, make sure you have the following installed:
 
| Tool | Version | Download |
|------|---------|----------|
| Node.js | LTS (18+) | https://nodejs.org |
| Git | Latest | https://git-scm.com |
 
Verify your installs by running:
 
```bash
node -v
npm -v
git -v
```
 
---
 
## Getting Started
 
Follow these steps in order to set up the project on your local machine.
 
### 1. Clone the repository
 
```bash
git clone https://github.com/shinramyeon22/Calyxia_Product-Management-System.git
cd Calyxia_Product-Management-System
```
 
### 2. Install dependencies
 
```bash
npm install
```
 
This reads `package.json` and installs all required packages automatically. Wait until it finishes before moving on.
 
### 3. Set up environment variables
 
Create a `.env` file in the **root folder** of the project (same level as `package.json`):
 
```bash
# .env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
 
> ⚠️ **Important:** The `.env` file is NOT included in the repository for security reasons. You must get these values from your team lead. Find them at:
> **Supabase Dashboard → Your Project → Project Settings → API**
 
### 4. Start the development server
 
```bash
npm run dev
```

## Contributing
 
Follow these steps every time you want to contribute to the project.
 
### Before you start working
 
Always pull the latest changes from `develop` first:
 
```bash
git pull origin develop
```
 
### Create your own branch
 
Never work directly on `main`. Always create a new branch:
 
```bash
git checkout -b feature-name/your-surname
```
 
Example:
 
```bash
git checkout -b login-page/Salcedo
git checkout -b dashboard-ui/Salcedo
```
 
### Make your changes, then commit and push
 
```bash
git add .
git commit -m "brief description of what you did"
git push origin your-branch-name
```