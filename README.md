# GitHub Run

> Turn any Python function in your GitHub repo into an instant API endpoint

## 🚀 Overview

GitHub Run is a serverless platform that lets you deploy Python functions as API endpoints with zero configuration. Just push your code to GitHub, and we'll handle the rest.

```python
# functions/hello.py
def hello(name: str = "World"):
    return {"message": f"Hello, {name}!"}
```

**Instant endpoint:** `https://api.githubrun.dev/you/repo/hello`

## ✨ Features

- **Zero Configuration** - Push Python functions, get instant APIs
- **Auto-Deploy on Push** - Every commit to main triggers deployment
- **Sandboxed Execution** - Secure, isolated Python runtime via Modal.com
- **Real-time Logs** - Watch your deployments happen live
- **API Key Management** - Generate keys, set rate limits
- **Usage Analytics** - Track calls, errors, and performance

## 🏗️ Tech Stack

- **Frontend:** Next.js 15 + React 19 + TypeScript + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Runtime:** Modal.com (Python sandboxing)
- **Hosting:** Vercel

## 📦 Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build
npm run build
```

## 📋 Roadmap

- [x] Project setup & landing page
- [ ] Database schema
- [ ] GitHub OAuth
- [ ] Webhook handler
- [ ] Modal.com executor
- [ ] Dashboard UI

## 📄 License

MIT
