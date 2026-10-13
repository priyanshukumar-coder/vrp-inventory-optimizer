# Contributing to VRP Inventory Optimizer

Thank you for your interest in contributing to the **Vehicle Routing Problem & Inventory Optimizer**! We welcome bug fixes, documentation improvements, optimization algorithms, and feature contributions.

---

## 🛠️ Code of Conduct

All contributors and participants are expected to adhere to our [Code of Conduct](CODE_OF_CONDUCT.md). Please be respectful, inclusive, and collaborative.

---

## 🚀 Getting Started

1. **Fork the Repository** on GitHub.
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/<your-username>/vrp-inventory-optimizer.git
   cd vrp-inventory-optimizer
   ```
3. **Create a descriptive feature branch**:
   ```bash
   git checkout -b feat/your-feature-name
   # or
   git checkout -b fix/issue-description
   ```

---

## 💻 Local Development Setup

### 1. Backend (FastAPI + Python 3.11+)
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend (Next.js 14 + TypeScript)
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Code Quality

Before opening a pull request, ensure all tests pass and builds succeed:

- **Frontend Build & Typecheck**:
  ```bash
  cd frontend
  npm run build
  npm run lint
  ```
- **Backend Tests**:
  ```bash
  cd backend
  pytest
  ```

---

## 📥 Submitting a Pull Request (PR)

1. Commit your changes with meaningful, conventional commit messages:
   - `feat: add new multi-depot heuristic solver`
   - `fix: correct MTZ subtour index bounds`
   - `docs: update deployment instructions`
2. Push your branch to GitHub:
   ```bash
   git push origin feat/your-feature-name
   ```
3. Open a Pull Request against the `main` branch.
4. Fill out the PR template describing the purpose and changes.
5. Ensure CI checks pass.

---

## 📄 License
By contributing to this repository, you agree that your contributions will be licensed under the [MIT License](LICENSE).
